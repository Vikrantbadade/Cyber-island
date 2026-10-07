import { QUESTS, QUEST_NPC_MAPPING } from '../config/storyData.js';

export class QuestSystem {
  constructor(game) {
    this.game = game;
    this.currentQuest = QUESTS.QUEST_1_DECODE_MESSAGE;
    this.questState = JSON.parse(JSON.stringify(QUESTS));

    // Challenge Investigation Progress State (6 Challenges)
    this.boatParts = {
      ch1: false,
      ch2: false,
      ch3: false,
      ch4: false,
      ch5: false,
      ch6: false
    };

    // DOM Elements
    this.hudElement = document.getElementById('quest-hud');
    this.titleElement = document.getElementById('quest-title');
    this.descElement = document.getElementById('quest-desc');
    this.objectivesContainer = document.getElementById('quest-objectives');
    this.boatCountElement = document.getElementById('boat-parts-count');

    // Minimize / expand toggle (assigned via onclick so scene restarts don't stack listeners)
    this.toggleBtn = document.getElementById('quest-toggle-btn');
    if (this.toggleBtn && this.hudElement) {
      this.toggleBtn.onclick = (e) => {
        e.stopPropagation();
        const minimized = this.hudElement.classList.toggle('minimized');
        this.toggleBtn.textContent = minimized ? '+' : '—';
      };
    }

    this.updateHUD();
    this.updateBoatHUD();
  }

  /**
   * Rebuild quest + boat-part state from server progress.
   * completedNumbers = challenge numbers (1..6) already completed on the backend.
   */
  restoreFromCompleted(completedNumbers) {
    const order = [
      'QUEST_1_DECODE_MESSAGE',
      'QUEST_2_OSINT',
      'QUEST_3_DEAD_NETWORK',
      'QUEST_4_ABNORMAL_SERVER',
      'QUEST_5_KEYLOGGER_INCIDENT',
      'QUEST_6_SUSPICIOUS_FILE'
    ];
    const done = new Set(completedNumbers);

    this.questState = JSON.parse(JSON.stringify(QUESTS));
    Object.keys(this.boatParts).forEach(key => { this.boatParts[key] = false; });

    done.forEach(n => {
      const questKey = order[n - 1];
      if (!questKey) return;
      this.questState[questKey].objectives.forEach(o => { o.completed = true; });
      this.boatParts[`ch${n}`] = true;
    });

    // Active quest = first challenge not yet completed (server enforces strict order)
    let next = 0;
    while (next < order.length && done.has(next + 1)) next++;
    const nextKey = next < order.length ? order[next] : 'QUEST_COMPLETE';
    this.currentQuest = this.questState[nextKey];

    this.updateHUD();
    this.updateBoatHUD();
  }

  setQuest(questKey) {
    if (this.questState[questKey]) {
      this.currentQuest = this.questState[questKey];
      this.updateHUD();
    }
  }

  completeObjective(questKey, objectiveId) {
    const quest = this.questState[questKey];
    if (!quest) return;

    const obj = quest.objectives.find(o => o.id === objectiveId);
    if (obj) {
      obj.completed = true;
    }

    // Check if all objectives in quest completed
    const allDone = quest.objectives.every(o => o.completed);
    this.updateHUD();

    return allDone;
  }

  collectBoatPart(partKey) {
    const aliasMap = {
      hull: 'ch1',
      rudder: 'ch2',
      engine: 'ch3',
      mast: 'ch4',
      nav: 'ch5',
      compass: 'ch5',
      sail: 'ch6'
    };
    const key = (aliasMap[partKey.toLowerCase()] || partKey).toLowerCase();
    if (this.boatParts.hasOwnProperty(key)) {
      this.boatParts[key] = true;
      this.updateBoatHUD();
    }
  }

  getCollectedPartsCount() {
    return Object.values(this.boatParts).filter(Boolean).length;
  }

  isBoatReadyToEscape() {
    return this.getCollectedPartsCount() >= 6 || (this.currentQuest && this.currentQuest.id === 'QUEST_COMPLETE');
  }

  getCurrentQuestId() {
    return this.currentQuest ? this.currentQuest.id : 'QUEST_1_DECODE_MESSAGE';
  }

  getActiveNPCId() {
    const activeQuestId = this.getCurrentQuestId();
    return QUEST_NPC_MAPPING[activeQuestId] || null;
  }

  isNPCActiveQuest(npcId) {
    return this.getActiveNPCId() === npcId;
  }

  isNPCQuestCompleted(npcId) {
    const questEntries = Object.entries(QUEST_NPC_MAPPING);
    const entry = questEntries.find(([_, id]) => id === npcId);
    if (!entry) return false;
    const [questKey] = entry;
    const stageOrder = [
      'QUEST_1_DECODE_MESSAGE',
      'QUEST_2_OSINT',
      'QUEST_3_DEAD_NETWORK',
      'QUEST_4_ABNORMAL_SERVER',
      'QUEST_5_KEYLOGGER_INCIDENT',
      'QUEST_6_SUSPICIOUS_FILE'
    ];
    const questIdx = stageOrder.indexOf(questKey);
    const currentIdx = stageOrder.indexOf(this.getCurrentQuestId());

    if (this.getCurrentQuestId() === 'QUEST_COMPLETE') return true;
    if (currentIdx === -1) return false;
    return currentIdx > questIdx;
  }

  updateBoatHUD() {
    const collectedCount = this.getCollectedPartsCount();
    if (this.boatCountElement) {
      this.boatCountElement.textContent = `${collectedCount} / 6`;
    }

    const partAliases = {
      ch1: ['ch1', 'hull'],
      ch2: ['ch2', 'rudder'],
      ch3: ['ch3', 'engine'],
      ch4: ['ch4', 'mast'],
      ch5: ['ch5', 'nav', 'compass'],
      ch6: ['ch6', 'sail']
    };

    Object.keys(this.boatParts).forEach(part => {
      const isCollected = this.boatParts[part];
      const selectors = (partAliases[part] || [part]).map(p => `.boat-part-item[data-part="${p}"]`).join(', ');
      const elements = document.querySelectorAll(selectors);
      elements.forEach(el => {
        if (isCollected) {
          el.classList.add('collected');
          const statusSpan = el.querySelector('.part-status');
          if (statusSpan) statusSpan.textContent = '✓';
        } else {
          el.classList.remove('collected');
          const statusSpan = el.querySelector('.part-status');
          if (statusSpan) statusSpan.textContent = '✗';
        }
      });
    });
  }

  updateHUD() {
    if (!this.currentQuest) return;

    if (this.titleElement) {
      this.titleElement.textContent = this.currentQuest.title;
    }
    if (this.descElement) {
      this.descElement.textContent = this.currentQuest.description;
    }

    if (this.objectivesContainer) {
      this.objectivesContainer.innerHTML = '';
      this.currentQuest.objectives.forEach(obj => {
        const div = document.createElement('div');
        div.className = `quest-objective ${obj.completed ? 'completed' : ''}`;
        div.innerHTML = `
          <span class="obj-check">${obj.completed ? '✓' : '○'}</span>
          <span class="obj-text">${obj.text}</span>
        `;
        this.objectivesContainer.appendChild(div);
      });
    }
  }
}

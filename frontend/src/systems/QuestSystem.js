import { QUESTS } from '../config/storyData.js';

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
    const key = partKey.toLowerCase();
    if (this.boatParts.hasOwnProperty(key)) {
      this.boatParts[key] = true;
      this.updateBoatHUD();
    }
  }

  getCollectedPartsCount() {
    return Object.values(this.boatParts).filter(Boolean).length;
  }

  isBoatReadyToEscape() {
    return Object.values(this.boatParts).every(Boolean);
  }

  getCurrentQuestId() {
    return this.currentQuest ? this.currentQuest.id : 'QUEST_1_DECODE_MESSAGE';
  }

  updateBoatHUD() {
    const collectedCount = this.getCollectedPartsCount();
    if (this.boatCountElement) {
      this.boatCountElement.textContent = `${collectedCount} / 6`;
    }

    Object.keys(this.boatParts).forEach(part => {
      const el = document.querySelector(`.boat-part-item[data-part="${part}"]`);
      if (el) {
        if (this.boatParts[part]) {
          el.classList.add('collected');
          const statusSpan = el.querySelector('.part-status');
          if (statusSpan) statusSpan.textContent = '✓';
        } else {
          el.classList.remove('collected');
          const statusSpan = el.querySelector('.part-status');
          if (statusSpan) statusSpan.textContent = '✗';
        }
      }
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

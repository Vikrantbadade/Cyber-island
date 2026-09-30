import { QUESTS } from '../config/storyData.js';

export class QuestSystem {
  constructor(game) {
    this.game = game;
    this.currentQuest = QUESTS.QUEST_1_FIND_ECHO;
    this.questState = JSON.parse(JSON.stringify(QUESTS));

    // Boat Parts Progression State (Escape Island GDD Section 6 & 25)
    this.boatParts = {
      hull: false,
      engine: false,
      mast: false,
      nav: false,
      sail: false
    };

    // DOM Elements
    this.hudElement = document.getElementById('quest-hud');
    this.titleElement = document.getElementById('quest-title');
    this.descElement = document.getElementById('quest-desc');
    this.objectivesContainer = document.getElementById('quest-objectives');
    this.boatCountElement = document.getElementById('boat-parts-count');

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

  updateBoatHUD() {
    const collectedCount = this.getCollectedPartsCount();
    if (this.boatCountElement) {
      this.boatCountElement.textContent = `${collectedCount} / 5`;
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
    if (!this.hudElement) return;

    this.hudElement.classList.remove('hidden');
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
        div.className = `objective-item ${obj.completed ? 'completed' : ''}`;
        
        const check = document.createElement('div');
        check.className = 'obj-checkbox';
        check.textContent = obj.completed ? '✓' : '';

        const label = document.createElement('span');
        label.textContent = obj.text;

        div.appendChild(check);
        div.appendChild(label);
        this.objectivesContainer.appendChild(div);
      });
    }
  }

  getCurrentQuestId() {
    return this.currentQuest ? this.currentQuest.id : null;
  }
}

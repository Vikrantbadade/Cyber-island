import { QUESTS } from '../config/storyData.js';

export class QuestSystem {
  constructor(game) {
    this.game = game;
    this.currentQuest = QUESTS.QUEST_1_FIND_ECHO;
    this.questState = JSON.parse(JSON.stringify(QUESTS));

    // DOM Elements
    this.hudElement = document.getElementById('quest-hud');
    this.titleElement = document.getElementById('quest-title');
    this.descElement = document.getElementById('quest-desc');
    this.objectivesContainer = document.getElementById('quest-objectives');

    this.updateHUD();
  }

  setQuest(questKey) {
    if (QUESTS[questKey]) {
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

  updateHUD() {
    if (!this.hudElement) return;

    this.hudElement.classList.remove('hidden');
    this.titleElement.textContent = this.currentQuest.title;
    this.descElement.textContent = this.currentQuest.description;

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

  getCurrentQuestId() {
    return this.currentQuest ? this.currentQuest.id : null;
  }
}

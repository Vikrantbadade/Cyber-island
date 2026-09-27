import Phaser from 'phaser';

export class InteractionSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.interactables = [];
    this.nearestTarget = null;

    // UI elements
    this.promptElement = document.getElementById('interaction-prompt');
    this.promptText = document.getElementById('prompt-text');
  }

  addInteractable(entity, name, onInteract, radius = 70) {
    const interactable = {
      entity,
      name,
      onInteract,
      radius
    };
    this.interactables.push(interactable);
    return interactable;
  }

  update() {
    if (!this.player || !this.player.body) return;

    let nearest = null;
    let minDistance = Infinity;

    this.interactables.forEach(item => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.entity.x, item.entity.y);
      if (dist < item.radius && dist < minDistance) {
        minDistance = dist;
        nearest = item;
      }
    });

    this.nearestTarget = nearest;

    if (nearest && this.promptElement && this.promptText) {
      this.promptElement.classList.remove('hidden');
      this.promptText.textContent = `Interact: ${nearest.name}`;
    } else if (this.promptElement) {
      this.promptElement.classList.add('hidden');
    }

    // Check interaction press
    if (this.nearestTarget && this.player.isInteractJustPressed()) {
      if (typeof this.nearestTarget.onInteract === 'function') {
        this.nearestTarget.onInteract(this.nearestTarget);
      }
    }
  }
}

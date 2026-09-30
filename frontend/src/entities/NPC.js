import Phaser from 'phaser';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, npcData) {
    super(scene, x, y, textureKey);

    this.scene = scene;
    this.id = npcData.id;
    this.name = npcData.name;
    this.dialogueKey = npcData.dialogueKey;
    this.color = npcData.color || 0x00f3ff;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    // Visual pulse animation
    scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Overhead Name Tag
    this.nameText = scene.add.text(x, y - 28, this.name, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Overhead Interaction Indicator badge
    this.indicator = scene.add.text(x, y - 44, '[E]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#00f3ff',
      backgroundColor: 'rgba(0, 243, 255, 0.15)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: this.indicator,
      y: y - 48,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Interaction Radius (distance threshold)
    this.interactionRadius = 60;
  }

  setIndicatorActive(active) {
    if (this.indicator) {
      this.indicator.setAlpha(active ? 1 : 0.4);
    }
  }

  setDialogueKey(key) {
    this.dialogueKey = key;
  }
}

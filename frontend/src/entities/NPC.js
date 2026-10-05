import Phaser from 'phaser';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, npcData) {
    super(scene, x, y, textureKey);

    this.scene = scene;
    this.id = npcData.id;
    this.name = npcData.name;
    this.dialogueKey = npcData.dialogueKey;
    this.color = npcData.color || 0x00f3ff;
    
    // Set origin to (0.5, 1) so NPC stands grounded on tile
    this.setOrigin(0.5, 1);

    // Apply scale from NPC data
    const baseScale = npcData.scale || 1;
    this.setScale(baseScale);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    this.refreshBody();

    // Visual pulse animation relative to baseScale
    scene.tweens.add({
      targets: this,
      scaleX: baseScale * 1.05,
      scaleY: baseScale * 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Position overhead labels dynamically above top of sprite
    const labelOffsetY = this.displayHeight + 10;

    // Overhead Name Tag
    this.nameText = scene.add.text(x, y - labelOffsetY, this.name, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Overhead Interaction Indicator badge
    this.indicator = scene.add.text(x, y - labelOffsetY - 16, '[E]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#00f3ff',
      backgroundColor: 'rgba(0, 243, 255, 0.15)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: this.indicator,
      y: y - labelOffsetY - 20,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.interactionRadius = 60;
  }

  setIndicatorActive(active) {
    if (this.indicator) {
      this.indicator.setAlpha(active ? 1 : 0.4);
    }
  }

  setQuestStatus(status) {
    if (!this.indicator) return;
    if (status === 'ACTIVE') {
      this.indicator.setText('[!] QUEST');
      this.indicator.setColor('#fbbf24');
      this.indicator.setBackgroundColor('rgba(245, 158, 11, 0.25)');
      this.indicator.setAlpha(1);
    } else if (status === 'COMPLETED') {
      this.indicator.setText('[✓] DONE');
      this.indicator.setColor('#4ade80');
      this.indicator.setBackgroundColor('rgba(74, 222, 128, 0.15)');
      this.indicator.setAlpha(0.85);
    } else {
      this.indicator.setText('[E] TALK');
      this.indicator.setColor('#00f3ff');
      this.indicator.setBackgroundColor('rgba(0, 243, 255, 0.12)');
      this.indicator.setAlpha(0.7);
    }
  }

  setDialogueKey(key) {
    this.dialogueKey = key;
  }
}

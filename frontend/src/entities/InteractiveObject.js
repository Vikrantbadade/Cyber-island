import Phaser from 'phaser';

export class InteractiveObject extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, objectData) {
    super(scene, x, y, textureKey);

    this.scene = scene;
    this.id = objectData.id;
    this.name = objectData.name;
    this.isOnline = objectData.isOnline || false;
    this.interactionRadius = 65;

    // Set origin to (0.5, 1) to anchor grounded at bottom-center
    this.setOrigin(0.5, 1);

    // Apply scale from object data
    const scale = objectData.scale || 1;
    this.setScale(scale);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body for collision
    this.refreshBody();

    // Position overhead labels dynamically above top of sprite
    const labelOffsetY = this.displayHeight + 12;

    // Title label above object
    this.label = scene.add.text(x, y - labelOffsetY, this.name, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Status Badge
    this.statusText = scene.add.text(x, y - labelOffsetY - 16, this.isOnline ? 'ONLINE' : 'OFFLINE', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: this.isOnline ? '#00ff9d' : '#ff007f',
      backgroundColor: this.isOnline ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 0, 127, 0.15)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    this.pulseGlow();
  }

  setOnline(status) {
    this.isOnline = status;
    if (this.statusText) {
      this.statusText.setText(status ? 'ONLINE' : 'OFFLINE');
      this.statusText.setColor(status ? '#00ff9d' : '#ff007f');
      this.statusText.setBackgroundColor(status ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 0, 127, 0.15)');
    }

    if (status) {
      // Spawn cyan beacon flare burst
      for (let i = 0; i < 12; i++) {
        const p = this.scene.add.circle(this.x, this.y - (this.displayHeight / 2), 4, 0x00f3ff, 0.9);
        const angle = (i / 12) * Math.PI * 2;
        const dist = 50 + Math.random() * 30;
        this.scene.tweens.add({
          targets: p,
          x: this.x + Math.cos(angle) * dist,
          y: (this.y - (this.displayHeight / 2)) + Math.sin(angle) * dist,
          alpha: 0,
          scale: 0.1,
          duration: 800,
          onComplete: () => p.destroy()
        });
      }
    }
  }

  pulseGlow() {
    this.scene.tweens.add({
      targets: this,
      alpha: 0.85,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}

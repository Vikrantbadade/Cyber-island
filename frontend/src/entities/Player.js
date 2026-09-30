import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player-tex');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speed = 220;

    // Body settings
    this.body.setCollideWorldBounds(true);
    this.body.setSize(24, 24);
    this.body.setOffset(4, 4);

    // Setup Keyboard WASD + Arrow Keys
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.E
    });

    // Particle pulse / trail emitter
    this.trailTimer = 0;
  }

  update(time, delta) {
    if (!this.body) return;

    let moveX = 0;
    let moveY = 0;

    // Check WASD and Arrows
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      moveX -= 1;
    }
    if (this.cursors.right.isDown || this.wasd.right.isDown) {
      moveX += 1;
    }
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      moveY -= 1;
    }
    if (this.cursors.down.isDown || this.wasd.down.isDown) {
      moveY += 1;
    }

    // Normalize diagonal movement speed
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    this.body.setVelocity(moveX * this.speed, moveY * this.speed);

    // Dynamic rotation towards movement direction
    if (moveX !== 0 || moveY !== 0) {
      const angle = Math.atan2(moveY, moveX);
      this.setRotation(angle + Math.PI / 2);

      // Footstep particle trail
      this.trailTimer += delta;
      if (this.trailTimer > 120) {
        this.trailTimer = 0;
        this.spawnTrailParticle();
      }
    }
  }

  spawnTrailParticle() {
    const particle = this.scene.add.circle(this.x, this.y, 4, 0x00f3ff, 0.6);
    this.scene.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 0.1,
      duration: 300,
      onComplete: () => particle.destroy()
    });
  }

  isInteractJustPressed() {
    return (
      Phaser.Input.Keyboard.JustDown(this.wasd.interact) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space)
    );
  }
}

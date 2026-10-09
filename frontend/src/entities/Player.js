import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    const textureKey = scene.textures.exists('player') ? 'player' : 'player-tex';
    super(scene, x, y, textureKey, 0);

    this.scene = scene;
    this.facing = 'down';
    this.isMoving = false;

    // Grounded origin at feet center
    this.setOrigin(0.5, 1);
    this.setScale(0.18);
    this.setDepth(10);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speed = 140;

    // Subtle drop shadow under feet to ground the player
    this.shadow = scene.add.ellipse(x, y - 2, 22, 10, 0x000000, 0.35);
    this.shadow.setDepth(9);

    // Collision Box around feet (in texture coordinates, frame is 160 x 270)
    this.body.setCollideWorldBounds(true);
    this.body.setSize(90, 55);
    this.body.setOffset(35, 210);

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

    // Start with idle animation if registered
    if (scene.anims.exists('player-idle-down')) {
      this.anims.play('player-idle-down');
    }
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

    // Keep sprite upright! Do NOT rotate.
    this.setRotation(0);

    // Synchronize shadow position
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y - 2);
    }

    // Dynamic depth sorting based on vertical position
    this.setDepth(10 + this.y * 0.001);

    // Directional walk & idle animation handling
    if (moveX !== 0 || moveY !== 0) {
      this.isMoving = true;

      // Determine facing direction cleanly without jitter
      if (moveX !== 0 && moveY === 0) {
        this.facing = moveX > 0 ? 'right' : 'left';
      } else if (moveY !== 0 && moveX === 0) {
        this.facing = moveY > 0 ? 'down' : 'up';
      } else if (moveX !== 0 && moveY !== 0) {
        // During diagonal movement, preserve active facing or default to horizontal
        if (this.facing === 'left' && moveX < 0) {
          // keep facing left
        } else if (this.facing === 'right' && moveX > 0) {
          // keep facing right
        } else if (this.facing === 'up' && moveY < 0) {
          // keep facing up
        } else if (this.facing === 'down' && moveY > 0) {
          // keep facing down
        } else {
          this.facing = moveX > 0 ? 'right' : 'left';
        }
      }

      const walkAnim = `player-walk-${this.facing}`;
      if (this.scene.anims.exists(walkAnim)) {
        this.anims.play(walkAnim, true);
      }

      // Footstep particle trail
      this.trailTimer += delta;
      if (this.trailTimer > 140) {
        this.trailTimer = 0;
        this.spawnTrailParticle();
      }
    } else {
      this.isMoving = false;
      const idleAnim = `player-idle-${this.facing}`;
      if (this.scene.anims.exists(idleAnim)) {
        this.anims.play(idleAnim, true);
      }
    }
  }

  spawnTrailParticle() {
    const particle = this.scene.add.circle(
      this.x + Phaser.Math.Between(-3, 3),
      this.y - 1,
      3,
      0x00f3ff,
      0.45
    );
    particle.setDepth(8);
    this.scene.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 0.1,
      y: this.y + 3,
      duration: 250,
      onComplete: () => particle.destroy()
    });
  }

  isInteractJustPressed() {
    return (
      Phaser.Input.Keyboard.JustDown(this.wasd.interact) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space)
    );
  }

  destroy(fromScene) {
    if (this.shadow) {
      this.shadow.destroy();
    }
    super.destroy(fromScene);
  }
}

import Phaser from 'phaser';
import { WORLD_DATA } from '../data/world.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.panDirection = 1;
    this.panSpeed = 15;
  }

  create() {
    const worldW = WORLD_DATA.worldDimensions.width;
    const worldH = WORLD_DATA.worldDimensions.height;

    // 1. Render Base Island World for scenic backdrop
    this.add.image(0, 0, 'base-world').setOrigin(0, 0);

    // Initial camera position focused near the scenic southern beach and broken boat
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.scrollX = 350;
    this.cameras.main.scrollY = 450;
    this.cameras.main.setZoom(1.1);

    // Show HTML Menu Overlay
    this.setupMenuUI();
  }

  update(time, delta) {
    // Gentle cinematic slow camera drift over the tropical island
    const dt = delta / 1000;
    this.cameras.main.scrollX += this.panSpeed * dt * this.panDirection;

    if (this.cameras.main.scrollX > 600) {
      this.panDirection = -1;
    } else if (this.cameras.main.scrollX < 200) {
      this.panDirection = 1;
    }
  }

  setupMenuUI() {
    const menuOverlay = document.getElementById('main-menu-overlay');
    const menuCard = document.getElementById('menu-card');
    const menuFooter = document.getElementById('menu-footer');

    const startBtn = document.getElementById('start-game-btn');
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    const storyBtn = document.getElementById('story-btn');
    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioText = document.getElementById('audio-status-text');

    const guideModal = document.getElementById('how-to-play-modal');
    const closeGuideBtn = document.getElementById('close-guide-btn');
    const guideOkBtn = document.getElementById('guide-ok-btn');

    const storyModal = document.getElementById('story-modal');
    const closeStoryBtn = document.getElementById('close-story-btn');
    const storyOkBtn = document.getElementById('story-ok-btn');

    const inGameMenuBtn = document.getElementById('in-game-menu-btn');
    const controlsHud = document.getElementById('controls-hud');
    const questHud = document.getElementById('quest-hud');

    // Sound toggle state
    if (typeof window.SOUND_ENABLED === 'undefined') {
      window.SOUND_ENABLED = true;
    }

    // Make sure menu overlay and card are clean & visible
    if (menuOverlay) menuOverlay.classList.remove('hidden');
    if (menuCard) menuCard.classList.remove('hidden');
    if (menuFooter) menuFooter.classList.remove('hidden');
    if (guideModal) guideModal.classList.add('hidden');
    if (storyModal) storyModal.classList.add('hidden');

    // In-game HUDs should remain hidden while on main menu
    if (controlsHud) controlsHud.classList.add('hidden');
    if (questHud) questHud.classList.add('hidden');

    // Play button audio feedback
    const playMenuBlip = (freq = 660) => {
      if (window.SOUND_ENABLED === false) return;
      try {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (!window.__menuAudioCtx && AudioCtxClass) {
          window.__menuAudioCtx = new AudioCtxClass();
        }
        const ctx = window.__menuAudioCtx;
        if (ctx && ctx.state === 'suspended') ctx.resume();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } catch (e) {}
    };

    // Button hover blips
    [startBtn, howToPlayBtn, storyBtn, audioBtn].forEach(btn => {
      if (btn) {
        btn.onmouseenter = () => playMenuBlip(440);
      }
    });

    // Start / Resume Game Action
    const startGame = () => {
      playMenuBlip(880);

      // Hide menu overlay and any modals
      if (menuOverlay) menuOverlay.classList.add('hidden');
      if (guideModal) guideModal.classList.add('hidden');
      if (storyModal) storyModal.classList.add('hidden');

      // Check if MainScene is already running (pause resume mode)
      if (this.scene.manager.isActive('MainScene')) {
        // Already in game, just resume
        return;
      }

      // Reveal gameplay HUDs
      if (controlsHud) controlsHud.classList.remove('hidden');
      if (questHud) questHud.classList.remove('hidden');

      // Camera flash transition
      this.cameras.main.fade(350, 0, 0, 0);
      this.time.delayedCall(380, () => {
        this.scene.stop('MenuScene');
        this.scene.start('MainScene');
      });
    };

    if (startBtn) {
      startBtn.onclick = (e) => {
        e.stopPropagation();
        startGame();
      };
    }

    // Keyboard ENTER / SPACE to start from main menu
    const keyHandler = (e) => {
      if (menuOverlay && !menuOverlay.classList.contains('hidden')) {
        // If modals are open, do not start game on enter
        if (guideModal && !guideModal.classList.contains('hidden')) {
          if (e.code === 'Escape' || e.code === 'Enter') {
            closeGuide(e);
          }
          return;
        }
        if (storyModal && !storyModal.classList.contains('hidden')) {
          if (e.code === 'Escape' || e.code === 'Enter') {
            closeStory(e);
          }
          return;
        }

        if (e.code === 'Enter' || e.code === 'Space') {
          startGame();
        }
      }
    };
    window.addEventListener('keydown', keyHandler);

    // Guide Modal
    if (howToPlayBtn && guideModal) {
      howToPlayBtn.onclick = (e) => {
        e.stopPropagation();
        playMenuBlip(550);
        // Hide the menu card so the modal is clearly front & center
        if (menuCard) menuCard.classList.add('hidden');
        if (menuFooter) menuFooter.classList.add('hidden');
        guideModal.classList.remove('hidden');
      };
    }

    const closeGuide = (e) => {
      if (e) e.stopPropagation();
      playMenuBlip(440);
      if (guideModal) guideModal.classList.add('hidden');
      if (menuCard) menuCard.classList.remove('hidden');
      if (menuFooter) menuFooter.classList.remove('hidden');
    };
    if (closeGuideBtn) closeGuideBtn.onclick = closeGuide;
    if (guideOkBtn) guideOkBtn.onclick = closeGuide;

    // Story Modal
    if (storyBtn && storyModal) {
      storyBtn.onclick = (e) => {
        e.stopPropagation();
        playMenuBlip(550);
        // Hide the menu card so the modal is clearly front & center
        if (menuCard) menuCard.classList.add('hidden');
        if (menuFooter) menuFooter.classList.add('hidden');
        storyModal.classList.remove('hidden');
      };
    }

    const closeStory = (e) => {
      if (e) e.stopPropagation();
      playMenuBlip(440);
      if (storyModal) storyModal.classList.add('hidden');
      if (menuCard) menuCard.classList.remove('hidden');
      if (menuFooter) menuFooter.classList.remove('hidden');
    };
    if (closeStoryBtn) closeStoryBtn.onclick = closeStory;
    if (storyOkBtn) storyOkBtn.onclick = closeStory;

    // Audio Toggle
    if (audioBtn && audioText) {
      audioBtn.onclick = (e) => {
        e.stopPropagation();
        window.SOUND_ENABLED = !window.SOUND_ENABLED;
        audioText.textContent = window.SOUND_ENABLED ? 'ON' : 'OFF';
        playMenuBlip(window.SOUND_ENABLED ? 700 : 350);
      };
    }

    // In-game Menu Button
    if (inGameMenuBtn) {
      inGameMenuBtn.onclick = (e) => {
        e.stopPropagation();
        playMenuBlip(550);
        if (menuOverlay) {
          menuOverlay.classList.remove('hidden');
          if (menuCard) menuCard.classList.remove('hidden');
          if (menuFooter) menuFooter.classList.remove('hidden');
          if (startBtn) {
            startBtn.innerHTML = '<span class="btn-cursor">▶</span> RESUME ADVENTURE';
          }
        }
      };
    }
  }
}

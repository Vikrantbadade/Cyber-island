import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { LoginScene } from './scenes/LoginScene.js';
import { loadFonts } from './services/fonts.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { MainScene } from './scenes/MainScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  pixelArt: true,
  backgroundColor: '#050811',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, LoginScene, MenuScene, GameScene, MainScene]
};

// Keeps the HTML UI layer perfectly synchronized and scaled 1:1 with the Phaser canvas
function syncUILayer() {
  const canvas = document.querySelector('#game-container canvas');
  const uiLayer = document.getElementById('ui-layer');
  if (!canvas || !uiLayer) return;

  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const scale = rect.width / 1280;

  uiLayer.style.position = 'fixed';
  uiLayer.style.left = `${rect.left}px`;
  uiLayer.style.top = `${rect.top}px`;
  uiLayer.style.width = '1280px';
  uiLayer.style.height = '720px';
  uiLayer.style.transform = `scale(${scale})`;
  uiLayer.style.transformOrigin = 'top left';
}

window.addEventListener('DOMContentLoaded', () => {
  // Non-blocking: Google Fonts first, local /fonts copy if that fails. Text swaps in when ready.
  loadFonts().then((source) => console.info(`[fonts] using ${source} fonts`));

  const game = new Phaser.Game(config);

  window.addEventListener('resize', syncUILayer);
  game.scale.on('resize', syncUILayer);

  // Sync continuously on frame updates to lock onto canvas
  const syncLoop = () => {
    syncUILayer();
    requestAnimationFrame(syncLoop);
  };
  requestAnimationFrame(syncLoop);
});

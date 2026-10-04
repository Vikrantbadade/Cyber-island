import Phaser from 'phaser';
import { ASSET_REGISTRY } from '../config/assetRegistry.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Render loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.add.text(width / 2, height / 2 - 20, 'INITIALIZING CYBERISLAND NEURAL GRID...', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      color: '#00f3ff'
    }).setOrigin(0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x0c1222, 0.8);
    progressBox.lineStyle(1, 0x00f3ff, 0.8);
    progressBox.strokeRect(width / 2 - 160, height / 2 + 20, 320, 16);
    progressBox.fillRect(width / 2 - 160, height / 2 + 20, 320, 16);

    // Load Master World Image & All PNG Assets from Asset Registry
    this.load.image('base-world', 'assets/world/CyberIsland_Base.png');
    this.load.image('player-tex', 'assets/world/main_character.png');

    Object.entries(ASSET_REGISTRY.world).forEach(([key, path]) => {
      this.load.image(key, path);
    });
    this.load.image('struct-broken-boat', 'assets/world/broken_boat-removebg-preview.png');

    // Load Supplied Ground Image Assets
    this.load.image('ground-grass', 'assets/tiles/ground/grass.png');
    this.load.image('ground-darkgrass', 'assets/tiles/ground/Dark grass.png');
    this.load.image('ground-dirtpath', 'assets/tiles/ground/Dirt path.png');
    this.load.image('ground-beach', 'assets/tiles/ground/Beach.png');
    this.load.image('ground-grassvar', 'assets/tiles/ground/Grass variation.png');
    this.load.image('ground-sand', 'assets/tiles/ground/Sand.png');
    this.load.image('ground-stone', 'assets/tiles/ground/Stone.png');
    this.load.image('ground-dirt', 'assets/tiles/ground/Dirt.png');
    this.load.image('map-concept', 'assets/map_concept.jpg');

    // Generate procedural graphics textures for buildings and entities
    this.createProceduralTextures();

    // Load progress handler
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x00f3ff, 1);
      progressBar.fillRect(width / 2 - 158, height / 2 + 22, 316 * value, 12);
    });

    this.load.on('complete', () => {
      this.scene.start('MenuScene');
    });
  }

  createProceduralTextures() {
    // 1. Player Sprite Texture (fallback only if image not loaded)
    if (!this.textures.exists('player-tex')) {
      const pG = this.make.graphics({ x: 0, y: 0, add: false });
      pG.fillStyle(0x00f3ff, 0.3);
      pG.fillCircle(16, 16, 16);
      pG.fillStyle(0x0d1c38, 1);
      pG.fillCircle(16, 16, 12);
      pG.lineStyle(2, 0x00f3ff, 1);
      pG.strokeCircle(16, 16, 12);
      pG.fillStyle(0x00f3ff, 1);
      pG.fillRect(12, 22, 8, 4);
      pG.fillStyle(0xff007f, 1);
      pG.fillCircle(16, 14, 4);
      pG.generateTexture('player-tex', 32, 32);
    }

    // 2. NPCs
    // Echo (Cyan Overseer)
    const eG = this.make.graphics({ x: 0, y: 0, add: false });
    eG.fillStyle(0x00f3ff, 0.2);
    eG.fillCircle(16, 16, 16);
    eG.fillStyle(0x102644, 1);
    eG.fillCircle(16, 16, 12);
    eG.lineStyle(2, 0x00f3ff, 1);
    eG.strokeCircle(16, 16, 12);
    eG.fillStyle(0x00f3ff, 1);
    eG.beginPath();
    eG.moveTo(16, 8); eG.lineTo(24, 16); eG.lineTo(16, 24); eG.lineTo(8, 16);
    eG.closePath();
    eG.fill();
    eG.generateTexture('npc-echo', 32, 32);

    // Nix (Magenta Specialist)
    const nG = this.make.graphics({ x: 0, y: 0, add: false });
    nG.fillStyle(0xff007f, 0.2);
    nG.fillCircle(16, 16, 16);
    nG.fillStyle(0x2a0c24, 1);
    nG.fillCircle(16, 16, 12);
    nG.lineStyle(2, 0xff007f, 1);
    nG.strokeCircle(16, 16, 12);
    nG.fillStyle(0xff007f, 1);
    nG.fillTriangle(16, 8, 24, 22, 8, 22);
    nG.generateTexture('npc-nix', 32, 32);

    // Workshop Worker (Amber/Orange)
    const wkG = this.make.graphics({ x: 0, y: 0, add: false });
    wkG.fillStyle(0xffa500, 0.2);
    wkG.fillCircle(16, 16, 16);
    wkG.fillStyle(0x2d1a04, 1);
    wkG.fillCircle(16, 16, 12);
    wkG.lineStyle(2, 0xffa500, 1);
    wkG.strokeCircle(16, 16, 12);
    wkG.fillStyle(0xffa500, 1);
    wkG.fillRect(10, 10, 12, 12);
    wkG.generateTexture('npc-workshop', 32, 32);

    // Master NPC (Purple/Gold)
    const mG = this.make.graphics({ x: 0, y: 0, add: false });
    mG.fillStyle(0xa855f7, 0.2);
    mG.fillCircle(16, 16, 16);
    mG.fillStyle(0x1e102d, 1);
    mG.fillCircle(16, 16, 12);
    mG.lineStyle(2, 0xa855f7, 1);
    mG.strokeCircle(16, 16, 12);
    mG.fillStyle(0xeab308, 1);
    mG.fillCircle(16, 16, 5);
    mG.generateTexture('npc-master', 32, 32);

    // Dr. Mira Sen (Teal Tech)
    const mrG = this.make.graphics({ x: 0, y: 0, add: false });
    mrG.fillStyle(0x14b8a6, 0.2);
    mrG.fillCircle(16, 16, 16);
    mrG.fillStyle(0x0a2928, 1);
    mrG.fillCircle(16, 16, 12);
    mrG.lineStyle(2, 0x14b8a6, 1);
    mrG.strokeCircle(16, 16, 12);
    mrG.fillStyle(0x2dd4bf, 1);
    mrG.fillRect(12, 12, 8, 8);
    mrG.generateTexture('npc-mira', 32, 32);

    // 3. Terminals / Nodes
    // Relay Node (48x48)
    const rG = this.make.graphics({ x: 0, y: 0, add: false });
    rG.fillStyle(0x0a1426, 1);
    rG.fillRect(8, 8, 32, 32);
    rG.lineStyle(2, 0x00f3ff, 1);
    rG.strokeRect(8, 8, 32, 32);
    rG.lineStyle(2, 0xffe600, 1);
    rG.strokeCircle(24, 24, 10);
    rG.fillStyle(0x00f3ff, 1);
    rG.fillCircle(24, 24, 5);
    rG.generateTexture('relay-node', 48, 48);

    // Main Cyber Tower Icon (64x64)
    const tG = this.make.graphics({ x: 0, y: 0, add: false });
    tG.fillStyle(0x070e1c, 1);
    tG.fillRect(8, 8, 48, 48);
    tG.lineStyle(3, 0x00f3ff, 1);
    tG.strokeRect(8, 8, 48, 48);
    tG.lineStyle(1, 0x00ff9d, 0.8);
    tG.strokeRect(16, 16, 32, 32);
    tG.fillStyle(0x00f3ff, 0.8);
    tG.fillCircle(32, 32, 12);
    tG.lineStyle(2, 0xff007f, 1);
    tG.strokeCircle(32, 32, 16);
    tG.generateTexture('cyber-tower', 64, 64);

    // 4. Terrain Tiles (32x32 each)
    // Deep Ocean Water
    const wG = this.make.graphics({ x: 0, y: 0, add: false });
    wG.fillStyle(0x030814, 1);
    wG.fillRect(0, 0, 32, 32);
    wG.lineStyle(1, 0x00f3ff, 0.12);
    wG.beginPath();
    wG.moveTo(4, 12); wG.lineTo(20, 12);
    wG.moveTo(12, 24); wG.lineTo(28, 24);
    wG.stroke();
    wG.generateTexture('tile-water', 32, 32);

    // Shallow Shore Water
    const swG = this.make.graphics({ x: 0, y: 0, add: false });
    swG.fillStyle(0x082038, 1);
    swG.fillRect(0, 0, 32, 32);
    swG.lineStyle(1, 0x38bdf8, 0.25);
    swG.beginPath();
    swG.moveTo(2, 8); swG.lineTo(18, 8);
    swG.moveTo(14, 20); swG.lineTo(30, 20);
    swG.stroke();
    swG.generateTexture('tile-water-shallow', 32, 32);

    // Beach Sand
    const sandG = this.make.graphics({ x: 0, y: 0, add: false });
    sandG.fillStyle(0x1e2c3b, 1);
    sandG.fillRect(0, 0, 32, 32);
    sandG.fillStyle(0x334155, 0.3);
    sandG.fillCircle(8, 8, 1.5);
    sandG.fillCircle(24, 20, 1.5);
    sandG.fillCircle(14, 26, 1.5);
    sandG.generateTexture('tile-sand', 32, 32);

    // Island Ground / Grass
    const lG = this.make.graphics({ x: 0, y: 0, add: false });
    lG.fillStyle(0x0b192e, 1);
    lG.fillRect(0, 0, 32, 32);
    lG.lineStyle(1, 0x132a4a, 1);
    lG.strokeRect(0, 0, 32, 32);
    lG.fillStyle(0x00f3ff, 0.12);
    lG.fillCircle(16, 16, 1.5);
    lG.generateTexture('tile-land', 32, 32);

    // Cliff / Ridge Face
    const cliffG = this.make.graphics({ x: 0, y: 0, add: false });
    cliffG.fillStyle(0x182232, 1);
    cliffG.fillRect(0, 0, 32, 32);
    cliffG.lineStyle(2, 0x334155, 1);
    cliffG.strokeRect(0, 0, 32, 32);
    cliffG.lineStyle(1, 0x00f3ff, 0.2);
    cliffG.beginPath();
    cliffG.moveTo(0, 16); cliffG.lineTo(32, 16);
    cliffG.stroke();
    cliffG.generateTexture('tile-cliff', 32, 32);

    // Cyber Path Tile
    const pathG = this.make.graphics({ x: 0, y: 0, add: false });
    pathG.fillStyle(0x132644, 1);
    pathG.fillRect(0, 0, 32, 32);
    pathG.lineStyle(1, 0x00f3ff, 0.35);
    pathG.strokeRect(2, 2, 28, 28);
    pathG.generateTexture('tile-path', 32, 32);

    // Wooden Bridge Tile
    const bridgeG = this.make.graphics({ x: 0, y: 0, add: false });
    bridgeG.fillStyle(0x3b2314, 1);
    bridgeG.fillRect(0, 0, 32, 32);
    bridgeG.lineStyle(1, 0x78350f, 1);
    bridgeG.strokeRect(0, 0, 32, 32);
    bridgeG.lineStyle(1, 0xd97706, 0.6);
    bridgeG.beginPath();
    bridgeG.moveTo(0, 8); bridgeG.lineTo(32, 8);
    bridgeG.moveTo(0, 16); bridgeG.lineTo(32, 16);
    bridgeG.moveTo(0, 24); bridgeG.lineTo(32, 24);
    bridgeG.stroke();
    bridgeG.generateTexture('tile-bridge', 32, 32);

    // 5. Environmental Obstacles & Decor
    // Green Cyber Tree (32x32)
    const treeG = this.make.graphics({ x: 0, y: 0, add: false });
    treeG.fillStyle(0x00ff9d, 0.25);
    treeG.fillTriangle(16, 2, 30, 28, 2, 28);
    treeG.lineStyle(1.5, 0x00ff9d, 1);
    treeG.strokeTriangle(16, 2, 30, 28, 2, 28);
    treeG.fillStyle(0x00f3ff, 0.8);
    treeG.fillCircle(16, 18, 4);
    treeG.generateTexture('tile-tree', 32, 32);

    // Autumn Cyber Tree (32x32)
    const treeAuG = this.make.graphics({ x: 0, y: 0, add: false });
    treeAuG.fillStyle(0xf97316, 0.3);
    treeAuG.fillTriangle(16, 2, 30, 28, 2, 28);
    treeAuG.lineStyle(1.5, 0xf97316, 1);
    treeAuG.strokeTriangle(16, 2, 30, 28, 2, 28);
    treeAuG.fillStyle(0xfacc15, 0.8);
    treeAuG.fillCircle(16, 18, 4);
    treeAuG.generateTexture('tile-tree-autumn', 32, 32);

    // Rock / Boulder (32x32)
    const rockG = this.make.graphics({ x: 0, y: 0, add: false });
    rockG.fillStyle(0x1e293b, 1);
    rockG.fillCircle(16, 16, 12);
    rockG.lineStyle(2, 0x475569, 1);
    rockG.strokeCircle(16, 16, 12);
    rockG.fillStyle(0x64748b, 1);
    rockG.fillCircle(12, 12, 4);
    rockG.generateTexture('tile-rock', 32, 32);

    // Fence (32x32)
    const fenceG = this.make.graphics({ x: 0, y: 0, add: false });
    fenceG.lineStyle(2, 0xb45309, 1);
    fenceG.strokeRect(4, 12, 24, 8);
    fenceG.fillRect(6, 4, 4, 24);
    fenceG.fillRect(22, 4, 4, 24);
    fenceG.generateTexture('tile-fence', 32, 32);

    // Crate / Box (32x32)
    const crateG = this.make.graphics({ x: 0, y: 0, add: false });
    crateG.fillStyle(0x78350f, 1);
    crateG.fillRect(4, 4, 24, 24);
    crateG.lineStyle(2, 0xd97706, 1);
    crateG.strokeRect(4, 4, 24, 24);
    crateG.beginPath();
    crateG.moveTo(4, 4); crateG.lineTo(28, 28);
    crateG.moveTo(28, 4); crateG.lineTo(4, 28);
    crateG.stroke();
    crateG.generateTexture('tile-crate', 32, 32);

    // Directional Sign (32x32)
    const signG = this.make.graphics({ x: 0, y: 0, add: false });
    signG.fillStyle(0x92400e, 1);
    signG.fillRect(14, 16, 4, 14);
    signG.fillStyle(0xd97706, 1);
    signG.fillRect(4, 4, 24, 12);
    signG.lineStyle(1, 0xfef08a, 1);
    signG.strokeRect(4, 4, 24, 12);
    signG.generateTexture('tile-sign', 32, 32);

    // 6. Major Location Structures & Buildings
    // Broken Boat (fallback only if image not loaded)
    if (!this.textures.exists('struct-broken-boat') && !this.textures.exists('OBJECT_BROKEN_BOAT')) {
      const boatG = this.make.graphics({ x: 0, y: 0, add: false });
      boatG.fillStyle(0x451a03, 1);
      boatG.beginPath();
      boatG.moveTo(8, 24); boatG.lineTo(56, 12); boatG.lineTo(48, 38); boatG.lineTo(16, 40);
      boatG.closePath();
      boatG.fill();
      boatG.lineStyle(2, 0xd97706, 1);
      boatG.stroke();
      boatG.fillStyle(0xef4444, 0.8);
      boatG.fillRect(20, 16, 16, 12);
      boatG.generateTexture('struct-broken-boat', 64, 48);
    }

    // Village House 1 (64x64)
    const h1G = this.make.graphics({ x: 0, y: 0, add: false });
    h1G.fillStyle(0x0f172a, 1);
    h1G.fillRect(8, 20, 48, 40);
    h1G.lineStyle(2, 0x00f3ff, 1);
    h1G.strokeRect(8, 20, 48, 40);
    // Roof
    h1G.fillStyle(0x0284c7, 1);
    h1G.fillTriangle(32, 4, 60, 22, 4, 22);
    h1G.lineStyle(2, 0x38bdf8, 1);
    h1G.strokeTriangle(32, 4, 60, 22, 4, 22);
    // Door & Window
    h1G.fillStyle(0x38bdf8, 0.8);
    h1G.fillRect(16, 28, 10, 10);
    h1G.fillStyle(0x00f3ff, 1);
    h1G.fillRect(36, 36, 12, 24);
    h1G.generateTexture('struct-house-1', 64, 64);

    // Village House 2 (64x64)
    const h2G = this.make.graphics({ x: 0, y: 0, add: false });
    h2G.fillStyle(0x1e102d, 1);
    h2G.fillRect(8, 20, 48, 40);
    h2G.lineStyle(2, 0xa855f7, 1);
    h2G.strokeRect(8, 20, 48, 40);
    // Roof
    h2G.fillStyle(0x7e22ce, 1);
    h2G.fillTriangle(32, 4, 60, 22, 4, 22);
    // Door & Window
    h2G.fillStyle(0xfacc15, 0.9);
    h2G.fillRect(38, 28, 10, 10);
    h2G.fillStyle(0xa855f7, 1);
    h2G.fillRect(16, 36, 12, 24);
    h2G.generateTexture('struct-house-2', 64, 64);

    // Village Fountain (64x64)
    const ftG = this.make.graphics({ x: 0, y: 0, add: false });
    ftG.fillStyle(0x0f172a, 1);
    ftG.fillCircle(32, 32, 28);
    ftG.lineStyle(2, 0x00f3ff, 1);
    ftG.strokeCircle(32, 32, 28);
    ftG.fillStyle(0x0284c7, 0.8);
    ftG.fillCircle(32, 32, 20);
    ftG.fillStyle(0x38bdf8, 1);
    ftG.fillCircle(32, 32, 8);
    ftG.generateTexture('struct-fountain', 64, 64);

    // Workshop Building (80x64)
    const wkBldG = this.make.graphics({ x: 0, y: 0, add: false });
    wkBldG.fillStyle(0x1c1917, 1);
    wkBldG.fillRect(8, 16, 64, 44);
    wkBldG.lineStyle(2, 0xf97316, 1);
    wkBldG.strokeRect(8, 16, 64, 44);
    // Flat metal roof
    wkBldG.fillStyle(0x44403c, 1);
    wkBldG.fillRect(4, 8, 72, 10);
    wkBldG.lineStyle(2, 0xf97316, 1);
    wkBldG.strokeRect(4, 8, 72, 10);
    // Gear / Wrench sign on wall
    wkBldG.fillStyle(0xf97316, 1);
    wkBldG.fillCircle(40, 28, 8);
    wkBldG.fillStyle(0x1c1917, 1);
    wkBldG.fillCircle(40, 28, 4);
    wkBldG.fillRect(32, 42, 16, 18);
    wkBldG.generateTexture('struct-workshop', 80, 64);

    // Master's Hut (80x64)
    const msBldG = this.make.graphics({ x: 0, y: 0, add: false });
    msBldG.fillStyle(0x1e1b4b, 1);
    msBldG.fillRect(8, 20, 64, 40);
    msBldG.lineStyle(2, 0x818cf8, 1);
    msBldG.strokeRect(8, 20, 64, 40);
    // Slanted roof
    msBldG.fillStyle(0x3730a3, 1);
    msBldG.fillTriangle(40, 4, 76, 22, 4, 22);
    msBldG.lineStyle(2, 0x6366f1, 1);
    msBldG.strokeTriangle(40, 4, 76, 22, 4, 22);
    // Glowing lantern
    msBldG.fillStyle(0xfacc15, 1);
    msBldG.fillCircle(18, 30, 4);
    msBldG.fillRect(52, 38, 14, 22);
    msBldG.generateTexture('struct-master-hut', 80, 64);

    // Dr. Mira's Lab (80x64)
    const mrBldG = this.make.graphics({ x: 0, y: 0, add: false });
    mrBldG.fillStyle(0x042f2e, 1);
    mrBldG.fillRect(8, 16, 64, 44);
    mrBldG.lineStyle(2, 0x14b8a6, 1);
    mrBldG.strokeRect(8, 16, 64, 44);
    // Roof dish
    mrBldG.fillStyle(0x0f766e, 1);
    mrBldG.fillRect(4, 10, 72, 8);
    mrBldG.lineStyle(2, 0x2dd4bf, 1);
    mrBldG.strokeCircle(56, 6, 8);
    mrBldG.fillStyle(0x2dd4bf, 1);
    mrBldG.fillRect(20, 24, 12, 10);
    mrBldG.fillRect(36, 38, 16, 22);
    mrBldG.generateTexture('struct-mira-lab', 80, 64);

    // Radio Tower (64x96)
    const rtG = this.make.graphics({ x: 0, y: 0, add: false });
    rtG.lineStyle(3, 0x00f3ff, 1);
    rtG.strokeTriangle(32, 8, 56, 88, 8, 88);
    rtG.lineStyle(1, 0x38bdf8, 0.8);
    rtG.beginPath();
    rtG.moveTo(20, 48); rtG.lineTo(44, 48);
    rtG.moveTo(14, 68); rtG.lineTo(50, 68);
    rtG.stroke();
    // Red beacon light at top
    rtG.fillStyle(0xef4444, 1);
    rtG.fillCircle(32, 8, 6);
    rtG.generateTexture('struct-radio-tower', 64, 96);

    // Old Terminal Station (48x48)
    const otG = this.make.graphics({ x: 0, y: 0, add: false });
    otG.fillStyle(0x0f172a, 1);
    otG.fillRect(6, 6, 36, 36);
    otG.lineStyle(2, 0x22c55e, 1);
    otG.strokeRect(6, 6, 36, 36);
    otG.fillStyle(0x15803d, 0.8);
    otG.fillRect(10, 10, 28, 18);
    otG.fillStyle(0x22c55e, 1);
    otG.fillRect(14, 14, 8, 2);
    otG.fillRect(14, 18, 12, 2);
    otG.generateTexture('struct-old-terminal', 48, 48);

    // Network Hub (64x48)
    const nhG = this.make.graphics({ x: 0, y: 0, add: false });
    nhG.fillStyle(0x0b0f19, 1);
    nhG.fillRect(4, 4, 56, 40);
    nhG.lineStyle(2, 0x3b82f6, 1);
    nhG.strokeRect(4, 4, 56, 40);
    nhG.fillStyle(0x1d4ed8, 0.8);
    nhG.fillRect(10, 10, 12, 28);
    nhG.fillRect(26, 10, 12, 28);
    nhG.fillRect(42, 10, 12, 28);
    nhG.fillStyle(0x60a5fa, 1);
    nhG.fillCircle(16, 16, 2);
    nhG.fillCircle(32, 16, 2);
    nhG.fillCircle(48, 16, 2);
    nhG.generateTexture('struct-network-hub', 64, 48);

    // Aegis Facility Bunker (96x80)
    const afG = this.make.graphics({ x: 0, y: 0, add: false });
    afG.fillStyle(0x111827, 1);
    afG.fillRect(8, 16, 80, 56);
    afG.lineStyle(3, 0xef4444, 1);
    afG.strokeRect(8, 16, 80, 56);
    // Heavy blast door
    afG.fillStyle(0x374151, 1);
    afG.fillRect(28, 30, 40, 42);
    afG.lineStyle(2, 0xef4444, 1);
    afG.strokeRect(28, 30, 40, 42);
    // Lock Symbol
    afG.fillStyle(0xef4444, 1);
    afG.fillCircle(48, 45, 6);
    afG.fillRect(45, 45, 6, 8);
    afG.generateTexture('struct-aegis-facility', 96, 80);

    // Lighthouse (64x112)
    const lhG = this.make.graphics({ x: 0, y: 0, add: false });
    lhG.fillStyle(0x1e293b, 1);
    lhG.beginPath();
    lhG.moveTo(20, 24); lhG.lineTo(44, 24); lhG.lineTo(52, 104); lhG.lineTo(12, 104);
    lhG.closePath();
    lhG.fill();
    lhG.lineStyle(2, 0xfacc15, 1);
    lhG.stroke();
    // Stripes
    lhG.fillStyle(0xd97706, 0.8);
    lhG.fillRect(16, 44, 32, 14);
    lhG.fillRect(14, 74, 36, 14);
    // Beacon Top
    lhG.fillStyle(0xfef08a, 1);
    lhG.fillRect(20, 8, 24, 16);
    lhG.lineStyle(2, 0xfacc15, 1);
    lhG.strokeRect(20, 8, 24, 16);
    lhG.generateTexture('struct-lighthouse', 64, 112);

    // Wooden Pier Crossing to Lighthouse (96x36)
    const pierG = this.make.graphics({ x: 0, y: 0, add: false });
    pierG.fillStyle(0x78350f, 1);
    pierG.fillRect(0, 6, 96, 24);
    for (let i = 0; i < 96; i += 8) {
      pierG.fillStyle(0x92400e, 1);
      pierG.fillRect(i, 6, 7, 24);
      pierG.fillStyle(0x451a03, 1);
      pierG.fillRect(i + 7, 6, 1, 24);
    }
    pierG.lineStyle(2, 0xd97706, 1);
    pierG.lineBetween(0, 6, 96, 6);
    pierG.lineBetween(0, 30, 96, 30);
    pierG.fillStyle(0x451a03, 1);
    pierG.fillRect(4, 2, 4, 32);
    pierG.fillRect(32, 2, 4, 32);
    pierG.fillRect(60, 2, 4, 32);
    pierG.fillRect(88, 2, 4, 32);
    pierG.generateTexture('struct-pier-crossing', 96, 36);

    // Forest Observatory Post (Top-Left OSINT Sanctuary) (64x64)
    const fsG = this.make.graphics({ x: 0, y: 0, add: false });
    fsG.fillStyle(0x1e3a2f, 1);
    fsG.fillRect(8, 16, 48, 40);
    fsG.lineStyle(2, 0x10b981, 1);
    fsG.strokeRect(8, 16, 48, 40);
    fsG.fillStyle(0x065f46, 1);
    fsG.fillTriangle(32, 4, 58, 18, 6, 18);
    fsG.lineStyle(2, 0x34d399, 1);
    fsG.lineBetween(32, 16, 44, 6);
    fsG.fillStyle(0x34d399, 1);
    fsG.fillCircle(44, 6, 4);
    fsG.generateTexture('struct-forest-sanctuary', 64, 64);
  }
}

import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { ChallengeUI } from '../systems/ChallengeUI.js';
import { WORLD_DATA } from '../data/world.js';
import { COLLISION_DATA } from '../data/collision.js';
import { DIALOGUES, NPC_INFO, getNPCAmbientDialogue } from '../config/storyData.js';
import { ENV } from '../config/env.js';
import { session } from '../services/session.js';
import { sessionUI } from '../systems/SessionUI.js';

export class GameScene extends Phaser.Scene {
  constructor(sceneKey = 'GameScene') {
    super(sceneKey);
  }

  create() {
    const worldW = WORLD_DATA.worldDimensions.width;  // 1671
    const worldH = WORLD_DATA.worldDimensions.height; // 941

    // Physics world bounds matching actual CyberIsland_Base.png dimensions
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // 1. BASE WORLD LAYER: Render master terrain image as actual game world
    this.baseWorldImage = this.add.image(0, 0, 'base-world').setOrigin(0, 0);

    // Systems
    this.dialogueSystem = new DialogueSystem(this.game);
    this.questSystem = new QuestSystem(this.game);
    this.challengeUI = new ChallengeUI(this.game);

    // Static physics group for collision obstacles
    this.obstaclesGroup = this.physics.add.staticGroup();

    // Load Collision Data from src/data/collision.js
    this.setupCollisionZones();

    // 2. SPAWN GAME OBJECTS (Buildings, Props, Decor) from src/data/world.js
    this.spawnWorldObjects();

    // 3. SPAWN PLAYER at playerStart from src/data/world.js
    this.player = new Player(this, WORLD_DATA.playerStart.x, WORLD_DATA.playerStart.y);

    // Interaction System
    this.interactionSystem = new InteractionSystem(this, this.player);

    // 4. SPAWN NPCs from src/data/world.js
    this.spawnNPCs();

    // CAMERA SETUP: 1280x720 viewport, bounded by CyberIsland_Base.png dimensions
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Player Physics Colliders
    this.physics.add.collider(this.player, this.obstaclesGroup);
    this.interactiveObjects.forEach(obj => {
      if (obj.id !== 'pier_crossing') {
        this.physics.add.collider(this.player, obj);
      }
    });
    this.npcs.forEach(npc => this.physics.add.collider(this.player, npc));

    // Collision visualization: shown by default in dev mode (`npm run dev`),
    // never in production builds. F3 toggles it while in dev.
    this.collisionGraphics = this.add.graphics().setDepth(1000);
    if (import.meta.env.DEV) {
      this.showCollisionDebug = true;
      this.drawCollisionDebug();
      this.input.keyboard.on('keydown-F3', (event) => {
        if (event && event.preventDefault) event.preventDefault();
        this.showCollisionDebug = !this.showCollisionDebug;
        this.drawCollisionDebug();
      });
      this.setupCollisionEditor();
    } else {
      this.showCollisionDebug = false;
    }

    // ESC key to toggle menu
    this.input.keyboard.on('keydown-ESC', () => {
      const menuOverlay = document.getElementById('main-menu-overlay');
      if (menuOverlay) {
        menuOverlay.classList.toggle('hidden');
      }
    });

    // Story intro sequence
    this.initSession();

    // Restart button event
    const restartBtn = document.getElementById('restart-game-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        document.getElementById('victory-modal').classList.add('hidden');
      });
    }

    // Screenshot mode trigger for full map view
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('screenshot') === '1') {
      this.showCollisionDebug = false;
      if (this.collisionGraphics) this.collisionGraphics.clear();
      const uiLayer = document.getElementById('ui-layer');
      if (uiLayer) uiLayer.style.display = 'none';
      const menuOverlay = document.getElementById('main-menu-overlay');
      if (menuOverlay) menuOverlay.style.display = 'none';

      this.cameras.main.stopFollow();
      this.cameras.main.setBounds(0, 0, worldW, worldH);
      this.cameras.main.setScroll(0, 0);
      this.cameras.main.setZoom(1);
      this.game.scale.resize(worldW, worldH);

      this.time.delayedCall(800, () => {
        this.game.renderer.snapshot((img) => {
          fetch('http://127.0.0.1:9876', {
            method: 'POST',
            body: img.src
          }).then(() => console.log('Screenshot posted to server!'));
        });
      });
    }
  }

  setupCollisionZones() {
    COLLISION_DATA.forEach(zone => {
      const rect = this.add.rectangle(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.width,
        zone.height,
        0x000000,
        0
      );
      this.physics.add.existing(rect, true);
      this.obstaclesGroup.add(rect);
    });
  }

  spawnWorldObjects() {
    this.interactiveObjects = [];

    WORLD_DATA.buildings.forEach(bld => {
      const obj = this.spawnBuilding(bld);
      this.interactiveObjects.push(obj);
    });

    // Spawn trees and decor
    WORLD_DATA.treesAndDecor.forEach(item => {
      const tree = this.obstaclesGroup.create(item.x, item.y, item.key);
      tree.refreshBody();
    });
  }

  spawnBuilding(data) {
    return this.spawnInteractiveObject(data);
  }

  spawnInteractiveObject(data) {
    const obj = new InteractiveObject(this, data.x, data.y, data.key || data.asset, {
      id: data.id,
      name: data.name,
      scale: data.scale || 1,
      collision: data.collision,
      isOnline: false
    });
    if (data.id === 'pier_crossing') {
      obj.setDepth(1);
    }
    return obj;
  }

  spawnNPCs() {
    this.npcs = [];

    WORLD_DATA.npcs.forEach(data => {
      const npc = this.spawnNPC(data);
      this.npcs.push(npc);
    });

    // Register with Interaction System
    this.registerInteractions();

    this.updateNPCBadges();
  }

  spawnNPC(data) {
    const npc = new NPC(this, data.x, data.y, data.key || data.asset, {
      id: data.id,
      name: data.name,
      color: data.color,
      scale: data.scale || 1,
      dialogueKey: data.dialogueKey
    });
    return npc;
  }

  registerInteractions() {
    if (!this.interactionSystem) return;

    // Register NPCs
    this.npcs.forEach(npc => {
      this.interactionSystem.addInteractable(npc, npc.name, () => {
        this.handleNPCInteraction(npc);
      }, 70);
    });

    // Register Interactive Objects (skip visual walkways)
    this.interactiveObjects.forEach(obj => {
      if (obj.id !== 'pier_crossing') {
        this.interactionSystem.addInteractable(obj, obj.name, () => {
          this.handleObjectInteraction(obj);
        }, 75);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // DEV-ONLY COLLISION EDITOR
  //   F4        toggle edit mode
  //   drag LMB  draw a new hitbox (snaps to 5px, active immediately so you can walk into it)
  //   Z         undo last new hitbox
  //   C         copy all new hitboxes to clipboard (also logged to console)
  // Paste the copied lines into COLLISION_DATA in src/data/collision.js.
  // ---------------------------------------------------------------------------
  setupCollisionEditor() {
    this.editorActive = false;
    this.editorRects = []; // { data, body }
    this.editorDrag = null;
    this.editorGraphics = this.add.graphics().setDepth(1001);
    this.editorLabel = this.add.text(12, 12, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fde047',
      backgroundColor: '#000000bb',
      padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(1002).setVisible(false);

    const snap = (v) => Math.round(v / 5) * 5;
    let cursor = { x: 0, y: 0 };

    const refresh = () => {
      this.editorGraphics.clear();
      this.editorLabel.setVisible(this.editorActive);
      if (!this.editorActive) return;

      // New (not-yet-saved) hitboxes in yellow
      this.editorGraphics.lineStyle(2, 0xfde047, 1);
      this.editorRects.forEach(({ data }) => {
        this.editorGraphics.strokeRect(data.x, data.y, data.width, data.height);
      });

      // Live preview of the rectangle being dragged, in cyan
      if (this.editorDrag) {
        const x = Math.min(this.editorDrag.x, cursor.x);
        const y = Math.min(this.editorDrag.y, cursor.y);
        const w = Math.abs(cursor.x - this.editorDrag.x);
        const h = Math.abs(cursor.y - this.editorDrag.y);
        this.editorGraphics.lineStyle(2, 0x22d3ee, 1);
        this.editorGraphics.strokeRect(x, y, w, h);
      }

      this.editorLabel.setText(
        `COLLISION EDITOR  x:${cursor.x} y:${cursor.y}  new:${this.editorRects.length}\n` +
        'drag=draw  Z=undo  C=copy  F4=exit'
      );
    };

    const copyAll = () => {
      if (!this.editorRects.length) return;
      const text = this.editorRects.map(({ data }) =>
        `  { id: '${data.id}', x: ${data.x}, y: ${data.y}, width: ${data.width}, height: ${data.height}, name: '${data.name}' },`
      ).join('\n');
      console.log('[collision editor] paste into COLLISION_DATA:\n' + text);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    };

    this.input.keyboard.on('keydown-F4', (event) => {
      if (event && event.preventDefault) event.preventDefault();
      this.editorActive = !this.editorActive;
      this.editorDrag = null;
      // make sure the existing zones are visible while editing
      if (this.editorActive && !this.showCollisionDebug) {
        this.showCollisionDebug = true;
        this.drawCollisionDebug();
      }
      refresh();
    });

    this.input.on('pointerdown', (p) => {
      if (!this.editorActive || !p.leftButtonDown()) return;
      this.editorDrag = { x: snap(p.worldX), y: snap(p.worldY) };
      refresh();
    });

    this.input.on('pointermove', (p) => {
      if (!this.editorActive) return;
      cursor = { x: snap(p.worldX), y: snap(p.worldY) };
      refresh();
    });

    this.input.on('pointerup', (p) => {
      if (!this.editorActive || !this.editorDrag) return;
      const x = Math.min(this.editorDrag.x, snap(p.worldX));
      const y = Math.min(this.editorDrag.y, snap(p.worldY));
      const width = Math.abs(snap(p.worldX) - this.editorDrag.x);
      const height = Math.abs(snap(p.worldY) - this.editorDrag.y);
      this.editorDrag = null;

      if (width >= 5 && height >= 5) {
        const n = (this.editorCounter = (this.editorCounter || 0) + 1);
        const data = { id: `custom_${n}`, x, y, width, height, name: `Custom ${n}` };

        // Active right away so the hitbox can be tested by walking into it
        const rect = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0);
        this.physics.add.existing(rect, true);
        this.obstaclesGroup.add(rect);

        this.editorRects.push({ data, body: rect });
        copyAll();
      }
      refresh();
    });

    this.input.keyboard.on('keydown-Z', () => {
      if (!this.editorActive || !this.editorRects.length) return;
      const last = this.editorRects.pop();
      this.obstaclesGroup.remove(last.body, true, true);
      copyAll();
      refresh();
    });

    this.input.keyboard.on('keydown-C', () => {
      if (this.editorActive) copyAll();
    });
  }

  drawCollisionDebug() {
    this.collisionGraphics.clear();
    if (!this.showCollisionDebug) return;

    // Hollow rectangles only (outline, no fill) so the map stays visible underneath
    this.collisionGraphics.lineStyle(2, 0x00ff00, 0.9);
    COLLISION_DATA.forEach(zone => {
      this.collisionGraphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
    });
  }

  triggerIntroSequence() {
    setTimeout(() => {
      this.dialogueSystem.startDialogue({
        speaker: 'STRANDED TRAVELER',
        portraitColor: '#38bdf8',
        lines: [
          "...Ouch, my head! The storm smashed my vessel against the reef!",
          "I seem to have washed ashore on this strange tropical island... and my skiff is completely wrecked.",
          "Key parts are scattered across the island (Hull, Rudder, Engine, Mast, Compass, Sail).",
          "I should explore inland and talk to the residents. Forest Scout Ren up at the northwest overlook might have seen something!"
        ]
      });
    }, 600);
  }

  // ---------------------------------------------------------------------------
  // BACKEND SESSION SYNC
  // ---------------------------------------------------------------------------
  async initSession() {
    this.alive = true;
    // Gameplay stays frozen until server progress is loaded (or immediately in the dev bypass)
    this.sessionReady = !session.enabled;
    this.events.once('shutdown', () => {
      this.alive = false;
      if (this.offAuthLost) this.offAuthLost();
    });

    if (!session.enabled) {
      // Dev bypass (VITE_SKIP_LOGIN): offline play, nothing is recorded
      sessionUI.hideHud();
      this.triggerIntroSequence();
      return;
    }

    sessionUI.showHud();
    this.challengeUI.onDesync = () => this.resyncFromServer();
    this.offAuthLost = session.on('auth-lost', (message) => {
      this.scene.start('LoginScene', { notice: message });
    });

    const loaded = await this.loadProgressFromServer();
    if (!loaded || !this.alive) return;
    this.sessionReady = true;

    // Returning teams (page refresh) skip the shipwreck intro
    if (this.questSystem.getCollectedPartsCount() === 0) {
      this.triggerIntroSequence();
    }
  }

  /** Fetch progress and rebuild quest + boat HUD from it. Retries until it works (or the session is lost). */
  async loadProgressFromServer() {
    while (this.alive) {
      try {
        await session.refreshProgress();
        this.questSystem.restoreFromCompleted(session.completedChallengeNumbers());
        this.updateNPCBadges();
        sessionUI.hideGate('conn');
        return true;
      } catch (err) {
        if (err.status === 401) return false; // 'auth-lost' handler returns us to the login screen
        sessionUI.showGate({
          owner: 'conn',
          icon: '⚠️',
          title: 'CONNECTION PROBLEM',
          message: 'Could not load your mission progress.',
          detail: `${err.message} RETRYING...`,
          allowLogout: true
        });
        await new Promise((resolve) => setTimeout(resolve, ENV.WAITING_POLL_MS));
      }
    }
    return false;
  }

  async resyncFromServer() {
    sessionUI.toast('PROGRESS OUT OF SYNC - RELOADING FROM SERVER', 'error');
    await this.loadProgressFromServer();
  }

  update(time, delta) {
    if (!this.player) return;

    // Frozen while progress is loading, or while the contest is not running (waiting / ended gate is shown)
    if (!this.sessionReady || session.locked) {
      if (this.player.body) this.player.body.setVelocity(0, 0);
      return;
    }

    if (this.dialogueSystem.isOpen) {
      if (this.player.isInteractJustPressed()) {
        this.dialogueSystem.advance();
      }
      return;
    }

    if (this.challengeUI.isOpen) {
      return;
    }

    this.player.update(time, delta);

    if (this.interactionSystem) {
      this.interactionSystem.update();
    }
  }

  updateNPCBadges() {
    if (!this.npcs || !this.questSystem) return;
    this.npcs.forEach(npc => {
      if (this.questSystem.isNPCActiveQuest(npc.id)) {
        npc.setQuestStatus('ACTIVE');
      } else if (this.questSystem.isNPCQuestCompleted(npc.id)) {
        npc.setQuestStatus('COMPLETED');
      } else {
        npc.setQuestStatus('INACTIVE');
      }
    });
  }

  handleNPCInteraction(npc) {
    const activeQuestId = this.questSystem.getCurrentQuestId();

    if (this.questSystem.isNPCActiveQuest(npc.id)) {
      this.triggerActiveQuestChallenge(activeQuestId);
    } else {
      const isCompleted = this.questSystem.isNPCQuestCompleted(npc.id);
      const dialogue = getNPCAmbientDialogue(npc.id, activeQuestId, isCompleted);
      this.dialogueSystem.startDialogue(dialogue);
    }
  }

  handleObjectInteraction(obj) {
    const activeQuestId = this.questSystem.getCurrentQuestId();
    const activeNpcId = this.questSystem.getActiveNPCId();
    const activeNpc = NPC_INFO[activeNpcId];

    if (obj.id === 'broken_boat') {
      const partsCount = this.questSystem.getCollectedPartsCount();
      if (this.questSystem.isBoatReadyToEscape() || activeQuestId === 'QUEST_COMPLETE') {
        this.dialogueSystem.startDialogue(DIALOGUES.BOAT_ESCAPE_READY, () => {
          this.triggerVictorySequence();
        });
      } else {
        const nextPrompt = activeNpc
          ? `Speak with ${activeNpc.name} at the ${activeNpc.location} to recover the next boat component.`
          : 'Explore the island and speak with the residents.';
        this.dialogueSystem.startDialogue({
          speaker: 'DAMAGED BOAT',
          portraitColor: '#d97706',
          lines: [
            `[ESCAPE VESSEL]: ${partsCount} / 6 Boat Components Installed.`,
            "The hull is battered, mast broken, and engine offline.",
            nextPrompt
          ]
        });
      }
    } else if (obj.id === 'mira_lab') {
      this.dialogueSystem.startDialogue({
        speaker: "DR. MIRA'S LAB",
        portraitColor: '#14b8a6',
        lines: [
          "[RESEARCH SANCTUARY] Central cryptographic facility.",
          "High-frequency spectrum transceivers hum quietly inside.",
          "Dr. Mira Sen conducts her post-shutdown research from here."
        ]
      });
    } else if (obj.id === 'old_terminal') {
      this.dialogueSystem.startDialogue({
        speaker: 'OLD AEGIS TERMINAL',
        portraitColor: '#22c55e',
        lines: [
          "[SYSTEM] Legacy Aegis Node 192.168.4.21.",
          "Phosphor CRT display pulses in standby mode. Network interface is listening."
        ]
      });
    } else if (obj.id === 'network_hub') {
      this.dialogueSystem.startDialogue({
        speaker: 'AEGIS ROUTING HUB',
        portraitColor: '#3b82f6',
        lines: [
          "[NETWORK CORE] Central Island Fiber Array.",
          "High-speed optical lines route between the village, laboratory subnets, and Sector 4."
        ]
      });
    } else if (obj.id === 'aegis_facility') {
      this.dialogueSystem.startDialogue({
        speaker: 'AEGIS VAULT',
        portraitColor: '#ef4444',
        lines: [
          "[AEGIS BUNKER] Heavy blast doors sealed during the evacuation 7 years ago.",
          "Status LEDs pulse red: core emergency protocols remain armed."
        ]
      });
    } else if (obj.id === 'radio_tower') {
      this.dialogueSystem.startDialogue({
        speaker: 'RADIO TRANSMISSION TOWER',
        portraitColor: '#38bdf8',
        lines: [
          "[COMM TOWER] Sector 4 high-gain microwave antenna.",
          "Transmitting automated beacon telemetry across the archipelago."
        ]
      });
    } else if (obj.id === 'cyber_terminal') {
      this.dialogueSystem.startDialogue({
        speaker: 'MAIN CYBER TERMINAL',
        portraitColor: '#00f3ff',
        lines: [
          "[VILLAGE CONSOLE] Overseer Echo's central island telemetry terminal.",
          "Grid health, sensor feeds, and environmental metrics stream in real time."
        ]
      });
    } else if (obj.id === 'workshop') {
      this.dialogueSystem.startDialogue({
        speaker: 'ISLAND WORKSHOP',
        portraitColor: '#ffa500',
        lines: [
          "[MAINTENANCE DEPOT] Tool benches, spare parts, and nautical hardware.",
          "Workshop Engineer uses this shop to maintain island equipment and salvage tech."
        ]
      });
    } else if (obj.id === 'master_hut') {
      this.dialogueSystem.startDialogue({
        speaker: "MASTER'S ARCHIVES",
        portraitColor: '#a855f7',
        lines: [
          "[HISTORICAL ARCHIVE] Quiet library preserved by The Master.",
          "Shelves lined with island chronicles, vintage equipment, and Aegis relics."
        ]
      });
    } else if (obj.id === 'forest_sanctuary') {
      this.dialogueSystem.startDialogue({
        speaker: 'FOREST OBSERVATORY',
        portraitColor: '#10b981',
        lines: [
          "[SYSTEM] Northwest Forest Observatory online.",
          "Scout Ren monitors Sector 4 horizons and incoming weather from here."
        ]
      });
    } else if (obj.id === 'lighthouse') {
      this.dialogueSystem.startDialogue({
        speaker: 'COASTAL LIGHTHOUSE',
        portraitColor: '#facc15',
        lines: [
          "[INSPECT] The Coastal Beacon of Sector 4.",
          "You look out from the eastern islet across the turquoise sea to the horizon."
        ]
      });
    }
  }

  triggerActiveQuestChallenge(questId) {
    if (questId === 'QUEST_1_DECODE_MESSAGE') {
      this.dialogueSystem.startDialogue(DIALOGUES.REN_CHALLENGE_1_INTRO, () => {
        this.challengeUI.openChallenge1_DecodeMessage(() => {
          this.questSystem.completeObjective('QUEST_1_DECODE_MESSAGE', 'obj_1');
          this.questSystem.collectBoatPart('ch1');
          this.questSystem.setQuest('QUEST_2_OSINT');
          this.updateNPCBadges();
          this.dialogueSystem.startDialogue(DIALOGUES.REN_CHALLENGE_1_SUCCESS);
        });
      });
    } else if (questId === 'QUEST_2_OSINT') {
      this.dialogueSystem.startDialogue(DIALOGUES.MASTER_CHALLENGE_2_INTRO, () => {
        this.challengeUI.openChallenge2_OSINT(() => {
          this.questSystem.completeObjective('QUEST_2_OSINT', 'obj_1');
          this.questSystem.collectBoatPart('ch2');
          this.questSystem.setQuest('QUEST_3_DEAD_NETWORK');
          this.updateNPCBadges();
          this.dialogueSystem.startDialogue(DIALOGUES.MASTER_CHALLENGE_2_SUCCESS);
        });
      });
    } else if (questId === 'QUEST_3_DEAD_NETWORK') {
      this.dialogueSystem.startDialogue(DIALOGUES.NIX_CHALLENGE_3_INTRO, () => {
        this.challengeUI.openChallenge3_DeadNetwork(() => {
          this.questSystem.completeObjective('QUEST_3_DEAD_NETWORK', 'obj_1');
          this.questSystem.collectBoatPart('ch3');
          this.questSystem.setQuest('QUEST_4_ABNORMAL_SERVER');
          this.updateNPCBadges();
          this.dialogueSystem.startDialogue(DIALOGUES.NIX_CHALLENGE_3_SUCCESS);
        });
      });
    } else if (questId === 'QUEST_4_ABNORMAL_SERVER') {
      this.dialogueSystem.startDialogue(DIALOGUES.WORKSHOP_CHALLENGE_4_INTRO, () => {
        this.challengeUI.openChallenge4_AbnormalServer(() => {
          this.questSystem.completeObjective('QUEST_4_ABNORMAL_SERVER', 'obj_1');
          this.questSystem.collectBoatPart('ch4');
          this.questSystem.setQuest('QUEST_5_KEYLOGGER_INCIDENT');
          this.updateNPCBadges();
          this.dialogueSystem.startDialogue(DIALOGUES.WORKSHOP_CHALLENGE_4_SUCCESS);
        });
      });
    } else if (questId === 'QUEST_5_KEYLOGGER_INCIDENT') {
      this.dialogueSystem.startDialogue(DIALOGUES.MIRA_CHALLENGE_5_INTRO, () => {
        this.challengeUI.openChallenge5_KeyloggerIncident(() => {
          this.questSystem.completeObjective('QUEST_5_KEYLOGGER_INCIDENT', 'obj_1');
          this.questSystem.collectBoatPart('ch5');
          this.questSystem.setQuest('QUEST_6_SUSPICIOUS_FILE');
          this.updateNPCBadges();
          this.dialogueSystem.startDialogue(DIALOGUES.MIRA_CHALLENGE_5_SUCCESS);
        });
      });
    } else if (questId === 'QUEST_6_SUSPICIOUS_FILE') {
      this.dialogueSystem.startDialogue(DIALOGUES.ECHO_CHALLENGE_6_INTRO, () => {
        this.challengeUI.openChallenge6_HiddenMap(() => {
          this.questSystem.completeObjective('QUEST_6_SUSPICIOUS_FILE', 'obj_1');
          this.questSystem.collectBoatPart('ch6');
          this.questSystem.setQuest('QUEST_COMPLETE');
          this.updateNPCBadges();
          this.dialogueSystem.startDialogue(DIALOGUES.ECHO_CHALLENGE_6_SUCCESS);
        });
      });
    } else if (questId === 'QUEST_COMPLETE') {
      this.dialogueSystem.startDialogue(DIALOGUES.MIRA_STORY_COMPLETE);
    }
  }

  triggerVictorySequence() {
    this.cameras.main.flash(1000, 0, 243, 255);
    setTimeout(() => {
      document.getElementById('victory-modal').classList.remove('hidden');
    }, 1200);
  }
}

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
import { DIALOGUES } from '../config/storyData.js';

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
    this.triggerIntroSequence();

    // Restart button event
    const restartBtn = document.getElementById('restart-game-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        document.getElementById('victory-modal').classList.add('hidden');
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
      const obj = new InteractiveObject(this, bld.x, bld.y, bld.key, {
        id: bld.id,
        name: bld.name,
        isOnline: false
      });
      if (bld.id === 'pier_crossing') {
        obj.setDepth(1);
      }
      this.interactiveObjects.push(obj);
    });

    // Spawn trees and decor
    WORLD_DATA.treesAndDecor.forEach(item => {
      const tree = this.obstaclesGroup.create(item.x, item.y, item.key);
      tree.refreshBody();
    });
  }

  spawnNPCs() {
    this.npcs = [];

    WORLD_DATA.npcs.forEach(data => {
      const npc = new NPC(this, data.x, data.y, data.key, {
        id: data.id,
        name: data.name,
        color: data.color,
        dialogueKey: data.dialogueKey
      });
      this.npcs.push(npc);
    });

    // Register with Interaction System
    this.registerInteractions();
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
          "Key parts are scattered across the island (Hull, Engine, Mast, Navigation, Sail).",
          "I should explore inland, talk to the residents, and find what I need to rebuild my boat and escape!"
        ]
      });
    }, 600);
  }

  update(time, delta) {
    if (!this.player) return;

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

  handleNPCInteraction(npc) {
    const activeQuestId = this.questSystem.getCurrentQuestId();

    if (npc.id === 'echo') {
      if (activeQuestId === 'QUEST_1_FIND_ECHO') {
        this.dialogueSystem.startDialogue(DIALOGUES.ECHO_INTRO, () => {
          this.questSystem.completeObjective('QUEST_1_FIND_ECHO', 'obj_1');
          this.questSystem.setQuest('QUEST_2_FIX_RELAY_ALPHA');
        });
      } else if (activeQuestId === 'QUEST_2_FIX_RELAY_ALPHA') {
        this.dialogueSystem.startDialogue(DIALOGUES.ECHO_WAITING_ALPHA);
      } else {
        this.dialogueSystem.startDialogue(DIALOGUES.ECHO_ALPHA_DONE);
      }
    } else if (npc.id === 'nix') {
      if (activeQuestId === 'QUEST_3_CONSULT_NIX') {
        this.dialogueSystem.startDialogue(DIALOGUES.NIX_INTRO, () => {
          this.questSystem.completeObjective('QUEST_3_CONSULT_NIX', 'obj_1');
          this.questSystem.setQuest('QUEST_4_ACTIVATE_TRANSMITTER');
          this.questSystem.collectBoatPart('mast');
        });
      } else {
        this.dialogueSystem.startDialogue(DIALOGUES.NIX_FINAL);
      }
    } else if (npc.id === 'workshop_worker') {
      this.dialogueSystem.startDialogue({
        speaker: 'WORKSHOP WORKER',
        portraitColor: '#f59e0b',
        lines: [
          "Welcome to the Island Workshop! The storm damaged several boats along the shore.",
          "Here, take this reinforced Hull plating! I salvaged it from the sandbar.",
          "Check with the other residents across the island to gather the remaining components."
        ]
      }, () => {
        this.questSystem.collectBoatPart('hull');
      });
    } else if (npc.id === 'master') {
      this.dialogueSystem.startDialogue({
        speaker: 'MASTER TAI',
        portraitColor: '#a855f7',
        lines: [
          "Greetings, traveler. You seek to escape the island, do you not?",
          "Patience and wisdom conquer all obstacles. Take this durable canvas Sail!",
          "Gather the remaining parts and the ocean winds will guide you home."
        ]
      }, () => {
        this.questSystem.collectBoatPart('sail');
      });
    } else if (npc.id === 'mira') {
      this.dialogueSystem.startDialogue(DIALOGUES.MIRA_NPC);
    } else if (npc.id === 'ranger') {
      this.dialogueSystem.startDialogue({
        speaker: 'FOREST SCOUT REN',
        portraitColor: '#22c55e',
        lines: [
          "Greetings! You made it all the way up to the Northwest Ridge!",
          "From this elevated grove, you can cross the wooden bridge east toward the waterfall.",
          "Keep an eye out for hidden clues among the island plateaus!"
        ]
      });
    }
  }

  handleObjectInteraction(obj) {
    const activeQuestId = this.questSystem.getCurrentQuestId();

    if (obj.id === 'relay_alpha') {
      if (activeQuestId === 'QUEST_2_FIX_RELAY_ALPHA' && !obj.isOnline) {
        this.challengeUI.openWaveformChallenge(() => {
          obj.setOnline(true);
          this.questSystem.completeObjective('QUEST_2_FIX_RELAY_ALPHA', 'obj_1');
          this.questSystem.completeObjective('QUEST_2_FIX_RELAY_ALPHA', 'obj_2');
          this.questSystem.collectBoatPart('engine');
          
          this.dialogueSystem.startDialogue({
            speaker: 'RELAY NODE ALPHA',
            portraitColor: '#00ff9d',
            lines: [
              "[SYSTEM] Signal Calibrated! The relay mechanism yielded an Boat Engine Module!",
              "Boat Component [ENGINE] added to your inventory.",
              "Return to Overseer Echo at the Island Hub to report grid status."
            ]
          });
        });
      } else {
        this.dialogueSystem.startDialogue({
          speaker: 'RELAY NODE ALPHA',
          portraitColor: '#00ff9d',
          lines: obj.isOnline
            ? ["[SYSTEM] Relay Node Alpha is ONLINE and functioning at 100% capacity."]
            : DIALOGUES.TERMINAL_ALPHA_OFFLINE.lines
        });
      }
    } else if (obj.id === 'radio_tower') {
      if (activeQuestId === 'QUEST_4_ACTIVATE_TRANSMITTER' && !obj.isOnline) {
        this.challengeUI.openPasscodeChallenge(() => {
          obj.setOnline(true);
          this.questSystem.completeObjective('QUEST_4_ACTIVATE_TRANSMITTER', 'obj_1');
          this.questSystem.completeObjective('QUEST_4_ACTIVATE_TRANSMITTER', 'obj_2');
          this.questSystem.setQuest('QUEST_COMPLETE');
          this.questSystem.collectBoatPart('nav');

          this.dialogueSystem.startDialogue({
            speaker: 'MAIN TOWER TERMINAL',
            portraitColor: '#38bdf8',
            lines: [
              "[SYSTEM] Decryption Accepted! Navigation Gyroscope recovered!",
              "Boat Component [NAVIGATION] added to your inventory.",
              "Head to the beach skiff with all 5 parts to make your escape!"
            ]
          });
        });
      } else {
        this.dialogueSystem.startDialogue({
          speaker: 'RADIO TOWER',
          portraitColor: '#00f3ff',
          lines: obj.isOnline
            ? ["[SYSTEM] Radio Tower Main Transmitter BROADCASTING THE LAST SIGNAL."]
            : DIALOGUES.MAIN_TOWER_OFFLINE.lines
        });
      }
    } else if (obj.id === 'broken_boat') {
      const partsCount = this.questSystem.getCollectedPartsCount();
      if (this.questSystem.isBoatReadyToEscape()) {
        this.dialogueSystem.startDialogue({
          speaker: 'REPAIRED BOAT',
          portraitColor: '#4ade80',
          lines: [
            "All 5 boat components have been assembled! Hull sealed, Engine mounted, Mast & Sail rigged, Navigation set!",
            "You push the boat into the surf and set sail toward home. YOU HAVE ESCAPED THE ISLAND!"
          ]
        }, () => {
          this.triggerVictorySequence();
        });
      } else {
        this.dialogueSystem.startDialogue({
          speaker: 'DAMAGED SKIFF',
          portraitColor: '#f97316',
          lines: [
            `[ESCAPE SKIFF] Current Progress: ${partsCount} / 5 Boat Components Installed.`,
            "Required: Hull, Engine, Mast, Navigation, Sail.",
            "Explore the island, speak with residents, and solve their challenges to recover all components!"
          ]
        });
      }
    } else if (obj.id === 'mira_lab') {
      this.dialogueSystem.startDialogue({
        speaker: "DR. MIRA'S LAB",
        portraitColor: '#14b8a6',
        lines: ["Dr. Mira's research hub. Technical investigation & OSINT consoles."]
      });
    } else if (obj.id === 'master_hut') {
      this.dialogueSystem.startDialogue({
        speaker: "MASTER'S HUT",
        portraitColor: '#a855f7',
        lines: ["The quiet sanctuary of The Master."]
      });
    } else if (obj.id === 'workshop') {
      this.dialogueSystem.startDialogue({
        speaker: "ISLAND WORKSHOP",
        portraitColor: '#ffa500',
        lines: ["Boat maintenance workshop. Spare parts are stored here."]
      });
    } else if (obj.id === 'aegis_facility') {
      this.dialogueSystem.startDialogue(DIALOGUES.AEGIS_FACILITY_DESC);
    } else if (obj.id === 'old_terminal') {
      this.dialogueSystem.startDialogue(DIALOGUES.OLD_TERMINAL_DESC);
    } else if (obj.id === 'network_hub') {
      this.dialogueSystem.startDialogue(DIALOGUES.NETWORK_HUB_DESC);
    } else if (obj.id === 'forest_sanctuary') {
      this.dialogueSystem.startDialogue({
        speaker: 'FOREST OBSERVATORY',
        portraitColor: '#10b981',
        lines: [
          "[SYSTEM] Northwest Forest Observatory online.",
          "Long-range sensors detect calm weather approaching the archipelago.",
          "Assemble all 5 boat components at the beach to prepare for your voyage!"
        ]
      });
    } else if (obj.id === 'lighthouse') {
      this.dialogueSystem.startDialogue({
        speaker: 'COASTAL LIGHTHOUSE',
        portraitColor: '#facc15',
        lines: [
          "[INSPECT] The Coastal Beacon of Escape Island.",
          "You look out from the eastern islet across the turquoise sea to the horizon.",
          "The footbridge leads safely back to shore. Rebuild your skiff to escape!"
        ]
      });
    }
  }

  triggerVictorySequence() {
    this.cameras.main.flash(1000, 0, 243, 255);
    setTimeout(() => {
      document.getElementById('victory-modal').classList.remove('hidden');
    }, 1200);
  }
}

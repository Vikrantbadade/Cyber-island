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
    this.interactiveObjects.forEach(obj => this.physics.add.collider(this.player, obj));
    this.npcs.forEach(npc => this.physics.add.collider(this.player, npc));

    // F3 Debug Toggle for Collision Visualization (Section 7)
    this.collisionGraphics = this.add.graphics();
    this.showCollisionDebug = false;
    this.input.keyboard.on('keydown-F3', () => {
      this.showCollisionDebug = !this.showCollisionDebug;
      this.drawCollisionDebug();
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

    // Register Interactive Objects
    this.interactiveObjects.forEach(obj => {
      this.interactionSystem.addInteractable(obj, obj.name, () => {
        this.handleObjectInteraction(obj);
      }, 75);
    });
  }

  drawCollisionDebug() {
    this.collisionGraphics.clear();
    if (!this.showCollisionDebug) return;

    this.collisionGraphics.lineStyle(2, 0x00ff00, 0.9);
    COLLISION_DATA.forEach(zone => {
      this.collisionGraphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
    });
  }

  triggerIntroSequence() {
    setTimeout(() => {
      this.dialogueSystem.startDialogue({
        speaker: 'SYSTEM NEURAL LINK',
        portraitColor: '#00f3ff',
        lines: [
          "[DISTRESS SIGNAL DETECTED]",
          "Unit-09 online. You have arrived at the southern beach of CyberIsland.",
          "Inspect the Broken Skiff or explore the island paths toward Dr. Mira's Lab and the Village."
        ]
      });
    }, 800);
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
        });
      } else {
        this.dialogueSystem.startDialogue(DIALOGUES.NIX_FINAL);
      }
    } else if (npc.id === 'workshop_worker') {
      this.dialogueSystem.startDialogue(DIALOGUES.WORKSHOP_WORKER);
    } else if (npc.id === 'master') {
      this.dialogueSystem.startDialogue(DIALOGUES.MASTER_NPC);
    } else if (npc.id === 'mira') {
      this.dialogueSystem.startDialogue(DIALOGUES.MIRA_NPC);
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
          
          this.dialogueSystem.startDialogue({
            speaker: 'RELAY NODE ALPHA',
            portraitColor: '#00ff9d',
            lines: [
              "[SYSTEM] Calibration Successful! Signal telemetry restored.",
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

          this.triggerVictorySequence();
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
      this.dialogueSystem.startDialogue(DIALOGUES.BROKEN_BOAT);
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
    } else if (obj.id === 'lighthouse') {
      this.dialogueSystem.startDialogue(DIALOGUES.LIGHTHOUSE_DESC);
    }
  }

  triggerVictorySequence() {
    this.cameras.main.flash(1000, 0, 243, 255);
    setTimeout(() => {
      document.getElementById('victory-modal').classList.remove('hidden');
    }, 1200);
  }
}

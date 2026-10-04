// World Object Data Configuration
// Maps game world objects to real PNG assets from ASSET_REGISTRY with exact scale & position rules

export const WORLD_OBJECTS = {
  buildings: [
    // SOUTH BEACH: Escape Boat
    {
      id: 'broken_boat',
      name: 'Broken Boat',
      asset: 'OBJECT_BROKEN_BOAT',
      x: 770,
      y: 830,
      scale: 0.35,
      collision: true
    },

    // VILLAGE / HUB (Lower Center)
    {
      id: 'workshop',
      name: 'Island Workshop',
      asset: 'BUILDING_WORKSHOP',
      x: 500,
      y: 560,
      scale: 0.25,
      collision: true
    },
    {
      id: 'house1',
      name: 'Village House 1',
      asset: 'BUILDING_VILLAGE_HOUSE_1',
      x: 750,
      y: 510,
      scale: 0.25,
      collision: true
    },
    {
      id: 'house2',
      name: 'Village House 2',
      asset: 'BUILDING_VILLAGE_HOUSE_2',
      x: 910,
      y: 510,
      scale: 0.25,
      collision: true
    },
    {
      id: 'house3',
      name: 'Village House 3',
      asset: 'BUILDING_VILLAGE_HOUSE_3',
      x: 650,
      y: 510,
      scale: 0.25,
      collision: true
    },
    {
      id: 'mira_lab',
      name: "Dr. Mira's Lab",
      asset: 'BUILDING_MIRA_LAB',
      x: 1050,
      y: 440,
      scale: 0.30,
      collision: true
    },
    {
      id: 'master_hut',
      name: "Master's House",
      asset: 'BUILDING_MASTER_HOUSE',
      x: 1220,
      y: 600,
      scale: 0.30,
      collision: true
    },

    // TOP-RIGHT: High Plateau
    {
      id: 'aegis_facility',
      name: 'Old Aegis Bunker',
      asset: 'BUILDING_AEGIS_FACILITY',
      x: 1260,
      y: 150,
      scale: 0.30,
      collision: true
    },
    {
      id: 'radio_tower',
      name: 'Radio Tower Transmitter',
      asset: 'OBJECT_RADIO_TOWER',
      x: 1330,
      y: 200,
      scale: 0.30,
      collision: true
    },

    // EAST COAST & ISLET: Coastal Lighthouse
    {
      id: 'lighthouse',
      name: 'Coastal Lighthouse',
      asset: 'BUILDING_LIGHTHOUSE',
      x: 1550,
      y: 380,
      scale: 0.35,
      collision: true
    },

    // SOUTHERN CLIFFS / TERMINALS
    {
      id: 'old_terminal',
      name: 'Old Unix Terminal',
      asset: 'OBJECT_OLD_TERMINAL',
      x: 1250,
      y: 780,
      scale: 0.20,
      collision: true
    },
    {
      id: 'network_hub',
      name: 'Island Routing Hub',
      asset: 'BUILDING_NETWORK_HUB',
      x: 1400,
      y: 620,
      scale: 0.30,
      collision: true
    },
    {
      id: 'cyber_terminal',
      name: 'Main Cyber Terminal',
      asset: 'OBJECT_CYBER_TERMINAL',
      x: 840,
      y: 650,
      scale: 0.20,
      collision: true
    }
  ],

  npcs: [
    {
      id: 'echo',
      name: 'Overseer Echo',
      asset: 'NPC_OVERSEER_ECHO',
      x: 830,
      y: 490,
      scale: 0.15,
      color: 0x00f3ff,
      dialogueKey: 'ECHO_INTRO'
    },
    {
      id: 'workshop_worker',
      name: 'Workshop Engineer',
      asset: 'NPC_WORKSHOP_WORKER',
      x: 540,
      y: 580,
      scale: 0.15,
      color: 0xffa500,
      dialogueKey: 'WORKSHOP_WORKER'
    },
    {
      id: 'mira',
      name: 'Dr. Mira Sen',
      asset: 'NPC_VILLAGER_2',
      x: 1000,
      y: 460,
      scale: 0.15,
      color: 0x14b8a6,
      dialogueKey: 'MIRA_NPC'
    },
    {
      id: 'nix',
      name: 'Specialist Nix',
      asset: 'NPC_VILLAGER_3',
      x: 1100,
      y: 460,
      scale: 0.15,
      color: 0xff007f,
      dialogueKey: 'NIX_WAITING'
    },
    {
      id: 'master',
      name: 'The Master',
      asset: 'NPC_MASTER',
      x: 1170,
      y: 620,
      scale: 0.18,
      color: 0xa855f7,
      dialogueKey: 'MASTER_NPC'
    },
    {
      id: 'ranger',
      name: 'Forest Scout Ren',
      asset: 'NPC_FOREST_SCOUT_REN',
      x: 350,
      y: 240,
      scale: 0.15,
      color: 0x22c55e,
      dialogueKey: 'RANGER_NPC'
    }
  ]
};

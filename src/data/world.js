// World Data Registry for CyberIsland: The Last Signal
// Based on actual CyberIsland_Base.png dimensions: 1671 x 941 pixels

export const WORLD_DATA = {
  worldDimensions: {
    width: 1671,
    height: 941
  },

  playerStart: {
    x: 840,
    y: 780
  },

  buildings: [
    { id: 'broken_boat', name: 'Broken Boat', x: 780, y: 810, key: 'struct-broken-boat' },
    { id: 'mira_lab', name: "Dr. Mira's Lab", x: 1050, y: 440, key: 'struct-mira-lab' },
    { id: 'master_hut', name: "Master's Hut", x: 1220, y: 600, key: 'struct-master-hut' },
    { id: 'workshop', name: 'Workshop', x: 500, y: 560, key: 'struct-workshop' },
    { id: 'fountain', name: 'Village Fountain', x: 830, y: 550, key: 'struct-fountain' },
    { id: 'house1', name: 'Village House', x: 750, y: 510, key: 'struct-house-1' },
    { id: 'house2', name: 'Village House', x: 910, y: 510, key: 'struct-house-2' },
    { id: 'radio_tower', name: 'Radio Tower', x: 830, y: 240, key: 'struct-radio-tower' },
    { id: 'aegis_facility', name: 'Old Aegis Facility (LOCKED)', x: 1280, y: 220, key: 'struct-aegis-facility' },
    { id: 'old_terminal', name: 'Old Terminal CLI', x: 1250, y: 780, key: 'struct-old-terminal' },
    { id: 'network_hub', name: 'Network Hub', x: 1400, y: 620, key: 'struct-network-hub' },
    { id: 'lighthouse', name: 'Lighthouse (LOCKED)', x: 1550, y: 420, key: 'struct-lighthouse' }
  ],

  npcs: [
    { id: 'echo', name: 'Overseer Echo', x: 830, y: 490, key: 'npc-echo', color: 0x00f3ff, dialogueKey: 'ECHO_INTRO' },
    { id: 'mira', name: 'Dr. Mira Sen', x: 1000, y: 460, key: 'npc-mira', color: 0x14b8a6, dialogueKey: 'MIRA_NPC' },
    { id: 'nix', name: 'Specialist Nix', x: 1100, y: 460, key: 'npc-nix', color: 0xff007f, dialogueKey: 'NIX_WAITING' },
    { id: 'master', name: 'The Master', x: 1170, y: 620, key: 'npc-master', color: 0xa855f7, dialogueKey: 'MASTER_NPC' },
    { id: 'workshop_worker', name: 'Workshop Worker', x: 540, y: 580, key: 'npc-workshop', color: 0xffa500, dialogueKey: 'WORKSHOP_WORKER' }
  ],

  treesAndDecor: [
    // Forest Boundary Trees (Upper North)
    { x: 420, y: 200, key: 'tile-tree' }, { x: 460, y: 220, key: 'tile-tree-autumn' },
    { x: 520, y: 180, key: 'tile-tree' }, { x: 580, y: 210, key: 'tile-tree' },
    { x: 640, y: 190, key: 'tile-tree-autumn' }, { x: 700, y: 220, key: 'tile-tree' },
    { x: 960, y: 200, key: 'tile-tree' }, { x: 1020, y: 180, key: 'tile-tree-autumn' },
    { x: 1080, y: 220, key: 'tile-tree' }, { x: 1140, y: 190, key: 'tile-tree' },
    { x: 1200, y: 230, key: 'tile-tree-autumn' },

    // Rocks & Fences
    { x: 440, y: 590, key: 'tile-fence' },
    { x: 560, y: 540, key: 'tile-crate' },
    { x: 770, y: 770, key: 'tile-sign' },
    { x: 830, y: 600, key: 'tile-sign' }
  ]
};

// World Data Registry for Escape Island
// Master World Size: 1671 x 941 pixels

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
    // SOUTH BEACH: Player Spawn & Escape Boat
    { id: 'broken_boat', name: 'Broken Boat', x: 780, y: 810, key: 'struct-broken-boat' },

    // VILLAGE / HUB (Lower Center):
    { id: 'workshop', name: 'Island Workshop', x: 500, y: 560, key: 'struct-workshop' },
    { id: 'fountain', name: 'Village Fountain', x: 830, y: 550, key: 'struct-fountain' },
    { id: 'house1', name: 'Village House Alpha', x: 750, y: 510, key: 'struct-house-1' },
    { id: 'house2', name: 'Village House Beta', x: 910, y: 510, key: 'struct-house-2' },
    { id: 'mira_lab', name: "Dr. Mira's Lab", x: 1050, y: 440, key: 'struct-mira-lab' },
    { id: 'master_hut', name: "Master's Sanctuary", x: 1220, y: 600, key: 'struct-master-hut' },

    // TOP-LEFT: Forest Observatory (OSINT)
    { id: 'forest_sanctuary', name: 'Forest Observatory', x: 300, y: 220, key: 'struct-forest-sanctuary' },

    // TOP-RIGHT: High Plateau (Radio Tower & Aegis Facility)
    { id: 'radio_tower', name: 'Radio Tower Transmitter', x: 1330, y: 200, key: 'struct-radio-tower' },
    { id: 'aegis_facility', name: 'Old Aegis Bunker (LOCKED)', x: 1260, y: 150, key: 'struct-aegis-facility' },

    // EAST COAST & ISLET: Lighthouse and Wooden Walkway
    { id: 'pier_crossing', name: 'Wooden Footbridge', x: 1485, y: 395, key: 'struct-pier-crossing' },
    { id: 'lighthouse', name: 'Coastal Lighthouse', x: 1550, y: 380, key: 'struct-lighthouse' },

    // SOUTHERN CLIFFS / TERMINALS:
    { id: 'old_terminal', name: 'Old Unix Terminal', x: 1250, y: 780, key: 'struct-old-terminal' },
    { id: 'network_hub', name: 'Island Routing Hub', x: 1400, y: 620, key: 'struct-network-hub' }
  ],

  npcs: [
    // Village Center
    { id: 'echo', name: 'Overseer Echo', x: 830, y: 490, key: 'npc-echo', color: 0x00f3ff, dialogueKey: 'ECHO_INTRO' },
    { id: 'workshop_worker', name: 'Workshop Worker', x: 540, y: 580, key: 'npc-workshop', color: 0xffa500, dialogueKey: 'WORKSHOP_WORKER' },

    // Eastern Shelves
    { id: 'mira', name: 'Dr. Mira Sen', x: 1000, y: 460, key: 'npc-mira', color: 0x14b8a6, dialogueKey: 'MIRA_NPC' },
    { id: 'nix', name: 'Specialist Nix', x: 1100, y: 460, key: 'npc-nix', color: 0xff007f, dialogueKey: 'NIX_WAITING' },
    { id: 'master', name: 'The Master', x: 1170, y: 620, key: 'npc-master', color: 0xa855f7, dialogueKey: 'MASTER_NPC' },

    // Top-Left Forest Ridge NPC
    { id: 'ranger', name: 'Forest Scout Ren', x: 350, y: 240, key: 'npc-mira', color: 0x22c55e, dialogueKey: 'RANGER_NPC' }
  ],

  treesAndDecor: [
    // Only non-obstructive props placed off pathways
    { x: 440, y: 590, key: 'tile-fence' },
    { x: 560, y: 540, key: 'tile-crate' },
    { x: 770, y: 770, key: 'tile-sign' },
    { x: 830, y: 600, key: 'tile-sign' }
  ]
};

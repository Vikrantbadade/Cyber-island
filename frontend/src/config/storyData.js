export const QUESTS = {
  QUEST_1_FIND_ECHO: {
    id: 'QUEST_1_FIND_ECHO',
    title: 'THE AWAKENING',
    description: 'Find Overseer Echo at the Island Hub to check the island status.',
    objectives: [
      { id: 'obj_1', text: 'Locate & speak to Overseer Echo', completed: false }
    ]
  },
  QUEST_2_FIX_RELAY_ALPHA: {
    id: 'QUEST_2_FIX_RELAY_ALPHA',
    title: 'SIGNAL REBOOT: ALPHA',
    description: 'Reboot Relay Node Alpha located on the Western Beach.',
    objectives: [
      { id: 'obj_1', text: 'Interact with Relay Node Alpha', completed: false },
      { id: 'obj_2', text: 'Calibrate Wave Signal Frequency', completed: false }
    ]
  },
  QUEST_3_CONSULT_NIX: {
    id: 'QUEST_3_CONSULT_NIX',
    title: 'CYPHER SECURITY',
    description: 'Consult Specialist Nix near the Eastern Array for the Main Transmitter code.',
    objectives: [
      { id: 'obj_1', text: 'Talk to Tech Specialist Nix', completed: false }
    ]
  },
  QUEST_4_ACTIVATE_TRANSMITTER: {
    id: 'QUEST_4_ACTIVATE_TRANSMITTER',
    title: 'THE LAST SIGNAL',
    description: 'Enter security code & broadcast the signal at the Main Cyber Tower.',
    objectives: [
      { id: 'obj_1', text: 'Access Main Cyber Tower Terminal', completed: false },
      { id: 'obj_2', text: 'Enter Security Passcode (7492)', completed: false }
    ]
  },
  QUEST_COMPLETE: {
    id: 'QUEST_COMPLETE',
    title: 'SIGNAL RESTORED',
    description: 'The CyberIsland communications array is online. You are free to explore.',
    objectives: [
      { id: 'obj_1', text: 'All main signals online', completed: true }
    ]
  }
};

export const DIALOGUES = {
  ECHO_INTRO: {
    speaker: 'OVERSEER ECHO',
    portraitColor: '#00f3ff',
    lines: [
      "Unit-09! You're finally awake. The island suffered a total power grid surge.",
      "Our main broadcast transmitter was knocked offline, isolating CyberIsland from the network.",
      "I need your help restoring the signal. First, head west to Relay Node Alpha and recalibrate its wave frequency."
    ],
    nextQuest: 'QUEST_2_FIX_RELAY_ALPHA'
  },
  ECHO_WAITING_ALPHA: {
    speaker: 'OVERSEER ECHO',
    portraitColor: '#00f3ff',
    lines: [
      "Relay Node Alpha is located on the Western shoreline.",
      "Align its signal frequency so we can regain partial grid telemetry."
    ]
  },
  ECHO_ALPHA_DONE: {
    speaker: 'OVERSEER ECHO',
    portraitColor: '#00f3ff',
    lines: [
      "Excellent work! Relay Node Alpha is showing solid cyan telemetry on my monitor.",
      "Now go speak with Specialist Nix on the eastern cliffside. She holds the security passcode for the Main Transmitter Tower."
    ],
    nextQuest: 'QUEST_3_CONSULT_NIX'
  },
  NIX_INTRO: {
    speaker: 'SPECIALIST NIX',
    portraitColor: '#ff007f',
    lines: [
      "Ah, Echo sent you? Good. The Main Transmitter is locked behind a 4-digit cipher.",
      "I calculated the frequency key from Node Alpha's telemetry.",
      "The security override code for the Main Cyber Tower is: 7 4 9 2.",
      "Repeat: 7 4 9 2. Input it at the central Cyber Tower terminal!"
    ],
    nextQuest: 'QUEST_4_ACTIVATE_TRANSMITTER'
  },
  NIX_WAITING: {
    speaker: 'SPECIALIST NIX',
    portraitColor: '#ff007f',
    lines: [
      "Don't forget the code: 7 4 9 2.",
      "Head to the Central Cyber Tower and enter it into the decryption terminal."
    ]
  },
  NIX_FINAL: {
    speaker: 'SPECIALIST NIX',
    portraitColor: '#ff007f',
    lines: [
      "Signal metrics are off the charts! CyberIsland is broadcasting across the entire quadrant."
    ]
  },
  TERMINAL_ALPHA_OFFLINE: {
    speaker: 'RELAY NODE ALPHA',
    portraitColor: '#ffe600',
    lines: [
      "[SYSTEM] Relay Node Alpha is currently locked.",
      "Please speak to Overseer Echo at the Island Hub first."
    ]
  },
  MAIN_TOWER_OFFLINE: {
    speaker: 'MAIN TOWER TERMINAL',
    portraitColor: '#ffe600',
    lines: [
      "[SYSTEM] Security clearance required.",
      "Obtain the 4-digit security code from Tech Specialist Nix before initializing."
    ]
  },
  WORKSHOP_WORKER: {
    speaker: 'WORKSHOP WORKER',
    portraitColor: '#ffa500',
    lines: [
      "Welcome to the Island Workshop! The storm damaged several boats along the shore.",
      "I'm gathering spare parts to repair the hull. Once the main signal is back up, we can set sail."
    ]
  },
  MASTER_NPC: {
    speaker: 'MASTER TAI',
    portraitColor: '#a855f7',
    lines: [
      "Greetings, traveler. CyberIsland holds deep secrets from the pre-surge era.",
      "Seek knowledge at Dr. Mira's Lab to the north if you wish to understand the origin of the Last Signal."
    ]
  },
  MIRA_NPC: {
    speaker: 'DR. MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "Hello! I am Dr. Mira Sen. My telemetry monitors are picking up heavy data packets across the array.",
      "The Aegis Facility and the Eastern Lighthouse are currently locked under emergency protocols."
    ]
  },
  BROKEN_BOAT: {
    speaker: 'STRANDED SKIFF',
    portraitColor: '#f97316',
    lines: [
      "[INSPECT] A weathered fiberglass skiff washed up on the beach. Its engine module is missing."
    ]
  },
  OLD_TERMINAL_DESC: {
    speaker: 'OLD TERMINAL',
    portraitColor: '#22c55e',
    lines: [
      "[SYSTEM] Legacy Unix/Linux CLI node detected. Offline diagnostic telemetry standby."
    ]
  },
  NETWORK_HUB_DESC: {
    speaker: 'NETWORK HUB',
    portraitColor: '#3b82f6',
    lines: [
      "[SYSTEM] Main Island Routing Array. Fiber cables connect to the central Aegis vault."
    ]
  },
  AEGIS_FACILITY_DESC: {
    speaker: 'AEGIS FACILITY',
    portraitColor: '#ef4444',
    lines: [
      "[SECURITY ALERT] Aegis Vault Blast Door is sealed. Level 4 Administrator credentials required."
    ]
  },
  LIGHTHOUSE_DESC: {
    speaker: 'ISLAND LIGHTHOUSE',
    portraitColor: '#facc15',
    lines: [
      "[SYSTEM] Automated Coastal Beacon. Currently locked under standby mode."
    ]
  }
};


// Centralized Story, Quest & Dialogue Data Registry for CyberIsland: Aegis Mystery

export const QUEST_NPC_MAPPING = {
  QUEST_1_DECODE_MESSAGE: 'ranger',
  QUEST_2_OSINT: 'master',
  QUEST_3_DEAD_NETWORK: 'nix',
  QUEST_4_ABNORMAL_SERVER: 'workshop_worker',
  QUEST_5_KEYLOGGER_INCIDENT: 'mira',
  QUEST_6_SUSPICIOUS_FILE: 'echo'
};

export const NPC_INFO = {
  ranger: {
    id: 'ranger',
    name: 'Forest Scout Ren',
    role: 'Lookout & Island Surveillance',
    location: 'Northwest Overlook',
    color: '#22c55e'
  },
  master: {
    id: 'master',
    name: 'The Master',
    role: 'Island Archivist & Historian',
    location: 'Southeast Archives',
    color: '#a855f7'
  },
  nix: {
    id: 'nix',
    name: 'Specialist Nix',
    role: 'Network Operations Technician',
    location: 'East Research Lab',
    color: '#ec4899'
  },
  workshop_worker: {
    id: 'workshop_worker',
    name: 'Workshop Engineer',
    role: 'Mechanical & Server Salvage',
    location: 'Island Workshop',
    color: '#ffa500'
  },
  mira: {
    id: 'mira',
    name: 'Dr. Mira Sen',
    role: 'Chief Aegis Cryptographer',
    location: 'Central Laboratory',
    color: '#14b8a6'
  },
  echo: {
    id: 'echo',
    name: 'Overseer Echo',
    role: 'Autonomous AI Supervisor',
    location: 'Village Center',
    color: '#00f3ff'
  }
};

export const QUESTS = {
  QUEST_1_DECODE_MESSAGE: {
    id: 'QUEST_1_DECODE_MESSAGE',
    stageNumber: 1,
    assignedNpcId: 'ranger',
    title: 'CHALLENGE 1: THE HIDDEN MESSAGE',
    description: 'A strange message from the old Aegis system is written entirely in unfamiliar symbols.',
    objectives: [
      { id: 'obj_1', text: 'Talk to Forest Scout Ren (Northwest Overlook), identify the alphabet & decode the message', completed: false }
    ]
  },
  QUEST_2_OSINT: {
    id: 'QUEST_2_OSINT',
    stageNumber: 2,
    assignedNpcId: 'master',
    title: 'CHALLENGE 2: OSINT INVESTIGATION',
    description: 'Social media clues about Dr. Mira Sen from before the Aegis evacuation.',
    objectives: [
      { id: 'obj_1', text: 'Talk to The Master (Southeast Archives) & find the event Mira designed a poster for', completed: false }
    ]
  },
  QUEST_3_DEAD_NETWORK: {
    id: 'QUEST_3_DEAD_NETWORK',
    stageNumber: 3,
    assignedNpcId: 'nix',
    title: 'CHALLENGE 3: DEAD NETWORK',
    description: 'An intercepted clue points to a well-known domain and its HTTPS port.',
    objectives: [
      { id: 'obj_1', text: 'Talk to Specialist Nix (East Lab) & Nmap-scan port 443 on google.com', completed: false }
    ]
  },
  QUEST_4_ABNORMAL_SERVER: {
    id: 'QUEST_4_ABNORMAL_SERVER',
    stageNumber: 4,
    assignedNpcId: 'workshop_worker',
    title: 'CHALLENGE 4: ABNORMAL SERVER',
    description: 'Live FTP server archive discovered on legacy port 21.',
    objectives: [
      { id: 'obj_1', text: 'Talk to Workshop Engineer (Island Workshop) & breach the FTP server', completed: false }
    ]
  },
  QUEST_5_KEYLOGGER_INCIDENT: {
    id: 'QUEST_5_KEYLOGGER_INCIDENT',
    stageNumber: 5,
    assignedNpcId: 'mira',
    title: 'CHALLENGE 5: KEYLOGGER INCIDENT',
    description: 'Dumped keystroke audit logs revealing post-shutdown vault access.',
    objectives: [
      { id: 'obj_1', text: 'Talk to Dr. Mira Sen (Central Lab) & analyze the keystroke log', completed: false }
    ]
  },
  QUEST_6_SUSPICIOUS_FILE: {
    id: 'QUEST_6_SUSPICIOUS_FILE',
    stageNumber: 6,
    assignedNpcId: 'echo',
    title: 'CHALLENGE 6: SUSPICIOUS FILE',
    description: 'The encrypted Genesis safeguard payload in the core vault.',
    objectives: [
      { id: 'obj_1', text: 'Talk to Overseer Echo (Village Center) & decode the Genesis payload', completed: false }
    ]
  },
  QUEST_COMPLETE: {
    id: 'QUEST_COMPLETE',
    stageNumber: 7,
    assignedNpcId: null,
    title: 'THE AEGIS MYSTERY UNRAVELED',
    description: 'All 6 challenges solved! All boat parts secured. Ready to escape!',
    objectives: [
      { id: 'obj_1', text: 'Return to the Broken Boat at the south beach to set sail and escape!', completed: true }
    ]
  }
};

export const DIALOGUES = {
  // =========================================================================
  // CHALLENGE 1: FOREST SCOUT REN (Northwest Overlook)
  // =========================================================================
  REN_CHALLENGE_1_INTRO: {
    speaker: 'FOREST SCOUT REN',
    portraitColor: '#22c55e',
    lines: [
      "Greetings, traveler! I watched your skiff smash on the outer reefs from up here.",
      "Player: My boat is completely wrecked. I need parts and tools to rebuild it.",
      "You're fortunate to have made it ashore alive! But something strange is happening on Cyber-Island.",
      "From this high overlook, my long-range sensor array intercepted an anomalous broadcast repeating across Sector 4.",
      "Player: What kind of broadcast?",
      "It is not plain text—the old Aegis system left behind a message written entirely in unfamiliar symbols.",
      "I found a file containing the symbols, but I don't recognize the writing system.",
      "Identify the alphabet, decode the symbols, and recover the hidden message."
    ]
  },
  REN_CHALLENGE_1_SUCCESS: {
    speaker: 'FOREST SCOUT REN',
    portraitColor: '#22c55e',
    lines: [
      "Player: I identified the alphabet and recovered the hidden message.",
      "So the old Aegis system left us a message after all... By the stars, this could explain what happened seven years ago!",
      "If Aegis systems are waking up, something huge is unfolding across the sector.",
      "Here—take this seasoned timber from our forest depot to repair your boat's hull!",
      "Player: Who knows what really happened to Aegis seven years ago?",
      "Seek out The Master at the southeast archive house. He preserves the island's historical records and relics. Go see him!"
    ]
  },

  // =========================================================================
  // CHALLENGE 2: THE MASTER (Southeast Archives)
  // =========================================================================
  MASTER_CHALLENGE_2_INTRO: {
  speaker: 'THE MASTER',
  portraitColor: '#a855f7',
  lines: [
    "Greetings, traveler. Scout Ren radioed that you decoded the strange message left by the old Aegis system.",
    "Player: Ren said you hold the historical archives from before the evacuation.",
    "Seven years ago, the Aegis signals vanished overnight. Everyone believed the project was abandoned.",
    "All I have left from that era are a few archived records and traces of people connected to the island.",
    "Player: Is there anything that could help me identify them?",
    "One name keeps appearing in the records: Mira. She was involved in club activities and helped with event preparations.",
    "Investigate the social media clues and discover which event Mira helped create a poster for."
  ]
},

MASTER_CHALLENGE_2_SUCCESS: {
  speaker: 'THE MASTER',
  portraitColor: '#a855f7',
  lines: [
    "Player: I discovered which event Mira helped create a poster for.",
    "Interesting. So you've managed to follow the trail and uncover her connection.",
    "Dr. Mira Sen may know more about what happened to Aegis than she has admitted.",
    "She has been staying at the central research laboratory, just to the northwest.",
    "Here, take this sturdy rudder and keel fitting from my workshop stores for your vessel.",
    "Player: Should I go confront Dr. Mira directly?",
    "Her network technician, Specialist Nix, is outside the lab monitoring the auxiliary subnets.",
    "Speak with Nix first—find out if Dr. Mira's old network infrastructure is actually communicating!"
  ]
},
  // =========================================================================
  // CHALLENGE 3: SPECIALIST NIX (East Research Lab)
  // =========================================================================
NIX_CHALLENGE_3_INTRO: {
  speaker: 'SPECIALIST NIX',
  portraitColor: '#ec4899',
  lines: [
    "Hey there, investigator! The Master told me you uncovered Dr. Mira's personnel dossier.",
    "He mentioned that you're ready to investigate a network mystery.",
    "That's right! I've intercepted a clue involving a well-known domain: google.com.",
    "Every network service communicates through ports, and HTTPS commonly uses port 443.",
    "But knowing the port number isn't enough. We need to determine its current status.",
    "Player: How do I investigate it?",
    "Open the terminal and use Nmap to scan port 443 on google.com.",
    "Your mission is to identify the HTTPS port and determine whether it is open.",
    "Submit your answer using the flag format: Suraksha{port_status}. Good luck, investigator!"
  ]
},

NIX_CHALLENGE_3_SUCCESS: {
  speaker: 'SPECIALIST NIX',
  portraitColor: '#ec4899',
  lines: [
    "Player: Investigation complete! HTTPS uses port 443, and the scan reports it as open.",
    "Excellent work! You've identified the port and interpreted the scan result correctly.",
    "That's the foundation of network reconnaissance: identifying services and understanding their status.",
    "You're getting closer to understanding how Aegis monitored its network.",
    "Here, take this boat engine motor assembly we salvaged from the communication array.",
    "Player: What's our next lead?",
    "The Workshop Engineer down at the island repair shop may know more about the old Aegis equipment.",
    "Head southwest to the workshop. Your investigation isn't over yet!"
  ]
},
  // =========================================================================
  // CHALLENGE 4: WORKSHOP ENGINEER (Island Workshop)
  // =========================================================================
WORKSHOP_CHALLENGE_4_INTRO: {
  speaker: 'WORKSHOP ENGINEER',
  portraitColor: '#ffa500',
  lines: [
    "Welcome to the Island Workshop! Specialist Nix told me you've been investigating the Aegis network.",
    "Player: I need to investigate another server and find a way to access it.",
    "Exactly! We've discovered an old Aegis node at 192.168.4.21.",
    "Your first task is to use Nmap to identify its open ports and the services running on them.",
    "Player: What should I look for?",
    "Check whether port 21 is open and identify the service associated with it.",
    "Player: It's FTP! How do I find out whether I can access it?",
    "Some FTP servers allow a special account called 'anonymous' instead of an individual username.",
    "Investigate the server's access configuration and submit the port number and username in the required flag format.",
    "Flag format: Suraksha{port_username}. Good luck, investigator!"
  ]
},

WORKSHOP_CHALLENGE_4_SUCCESS: {
  speaker: 'WORKSHOP ENGINEER',
  portraitColor: '#ffa500',
  lines: [
    "Player: Investigation complete! Port 21 is open, and the FTP server allows anonymous access.",
    "Excellent work! You've identified the service and discovered its access configuration.",
    "The archive contains the mechanical schematics and structural fittings we need for your escape vessel!",
    "Player: Did you find anything else in the archive?",
    "Yes. There's a suspicious keystroke capture log showing activity from an island terminal.",
    "The user identity in the log matches Dr. Mira Sen's personal cryptographic terminal!",
    "Player: Why was Mira's terminal interacting with the old Aegis system?",
    "That's the question we need answered. Take these logs and confront Dr. Mira Sen at the central lab!"
  ]
},

  // =========================================================================
  // CHALLENGE 5: DR. MIRA SEN (Central Laboratory)
  // =========================================================================
  MIRA_CHALLENGE_5_INTRO: {
    speaker: 'DR. MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "You come bearing the keystroke audit logs from the workshop FTP server...",
      "Player: Mira... what is this?",
      "A mistake. Mine.",
      "Player: This log records raw keyboard activity. Someone captured what was being typed.",
      "Yes. When Aegis was shut down seven years ago, I couldn't bear to abandon everything we built.",
      "Someone was logging every keypress on the system.",
      "Player: There is so much noise here. What am I looking for?",
      "Don't read every entry. Search the activity log for the login that was actually granted, and recover the ID and password that were used."
    ]
  },
  MIRA_CHALLENGE_5_SUCCESS: {
    speaker: 'DR. MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "Player: I found the successful login: system 'aegis-vault-07'.",
      "...",
      "Player: You logged into Aegis Vault 07 after the shutdown was already finalized.",
      "Yes. I did.",
      "Player: Why, Mira? What was inside Vault 07?",
      "The genesis safeguard code for Overseer Echo.",
      "Aegis was never an aggressive weapon—it was built to protect the people of this island.",
      "I transferred the core intelligence into Overseer Echo to maintain the sanctuary autonomously.",
      "Here, take this navigational compass and nautical charts for your skiff.",
      "Take the encrypted vault payload from my terminal to Overseer Echo in the village square.",
      "It's time to unlock the final protocol."
    ]
  },

// CHALLENGE 6: OVERSEER ECHO — THE HIDDEN MAP
ECHO_CHALLENGE_6_INTRO: {
  speaker: 'OVERSEER ECHO',
  portraitColor: '#00f3ff',
  lines: [
    "Investigator identified. Your progress through the Aegis records has been logged.",
    "Player: ECHO, I've received two images. One shows a map on a chocolate bar, and the other is a satellite view.",
    "Correct. These images contain a geographic clue, but the location has not yet been identified.",
    "Player: How can I find the place?",
    "Compare the shape of the map with the satellite image. Examine coastlines, roads, boundaries, and other distinctive features.",
    "You may use Google Images, Google Maps, or Google Earth to investigate the location.",
    "Player: And what do I need to submit?",
    "Recover the exact latitude and longitude of the matching location.",
    "Submit your answer using the flag format: Suraksha{latitude_longitude}. The coordinates will verify your investigation."
  ]
},

ECHO_CHALLENGE_6_SUCCESS: {
  speaker: 'OVERSEER ECHO',
  portraitColor: '#00f3ff',
  lines: [
    "Player: The coordinates have been identified and submitted!",
    "Geographic verification accepted. The location matches the hidden map.",
    "Excellent work. You have used visual evidence and open-source information to uncover a location.",
    "Player: What does this place have to do with Aegis?",
    "The coordinates reveal the final location recorded in the Aegis archive.",
    "Seven years ago, Dr. Mira Sen left a final trace for anyone curious enough to follow it.",
    "You have demonstrated observation, patience, and investigative reasoning.",
    "Here is the final component for your vessel: the reinforced main sail and island exit clearance!",
    "Your boat at the southern beach is fully restored and ready for departure.",
    "Go, traveler. Set sail into the horizon—and know that Cyber-Island is forever protected."
  ]
},

  // =========================================================================
  // STORY COMPLETION & BOAT ESCAPE
  // =========================================================================
  MIRA_STORY_COMPLETE: {
    speaker: 'DR. MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "You decoded ECHO's payload message! Aegis was never truly offline...",
      "ECHO was an autonomous safeguard system created seven years ago to protect this island.",
      "All 6 boat components have been assembled. Your vessel at the beach is ready to sail.",
      "Thank you for uncovering the truth about what happened here. Have a safe journey!"
    ]
  },
  BOAT_ESCAPE_READY: {
    speaker: 'REPAIRED BOAT',
    portraitColor: '#4ade80',
    lines: [
      "All 6 boat components are assembled! Hull sealed, Rudder set, Engine mounted, Mast rigged, Compass aligned, Sail hoisted!",
      "Overseer Echo has granted official exit clearance for your vessel.",
      "You push the boat into the surf and set sail toward home. YOU HAVE ESCAPED CYBER-ISLAND!"
    ]
  },

  // =========================================================================
  // BACKWARD-COMPATIBILITY ALIASES
  // =========================================================================
  MIRA_CHALLENGE_1_INTRO: {
    speaker: 'FOREST SCOUT REN',
    portraitColor: '#22c55e',
    lines: [
      "Greetings, traveler! I watched your skiff smash on the outer reefs from up here.",
      "Player: The storm wrecked my boat completely. I need parts to rebuild it.",
      "From this high overlook, my long-range sensor array intercepted an anomalous broadcast repeating across Sector 4.",
      "Identify the writing system and decode the hidden message!"
    ]
  },
  MIRA_CHALLENGE_2_INTRO: {
    speaker: 'THE MASTER',
    portraitColor: '#a855f7',
    lines: [
      "Seven years ago, the Aegis signals vanished overnight. Look at what was left behind.",
      "Inspect the photograph's metadata and discover who led cryptographic research."
    ]
  },
  MIRA_CHALLENGE_3_INTRO: {
    speaker: 'SPECIALIST NIX',
    portraitColor: '#ec4899',
    lines: [
      "Host 192.168.4.21 is marked offline, but my packet sniffers sense traffic.",
      "Scan the host to discover what service is actually running!"
    ]
  },
  MIRA_CHALLENGE_4_INTRO: {
    speaker: 'WORKSHOP ENGINEER',
    portraitColor: '#ffa500',
    lines: [
      "An active FTP archive on port 21! If we can access it, we can recover boat schematics.",
      "Try authenticating using the standard anonymous user account!"
    ]
  },
  MIRA_CHALLENGE_5_POST: {
    speaker: 'DR. MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "Player: I found the successful login: system 'aegis-vault-07'.",
      "Yes... I logged in after the shutdown to preserve the Genesis safeguard inside Overseer Echo.",
      "Take the encrypted vault payload to Overseer Echo in the village square to unlock the final protocol!"
    ]
  },
  MIRA_CHALLENGE_6_INTRO: {
    speaker: 'OVERSEER ECHO',
    portraitColor: '#00f3ff',
    lines: [
      "Protected file /sys/vault/echo_payload.bin loaded.",
      "Decode the ROT13 ciphertext 'RPUB UVQQRA VA TRARFVF' to initialize the Genesis Safeguard Protocol."
    ]
  },

  // =========================================================================
  // OTHER NPCS & LANDMARKS
  // =========================================================================
  OVERSEER_ECHO_DESC: {
    speaker: 'OVERSEER ECHO',
    portraitColor: '#00f3ff',
    lines: [
      "I am Overseer Echo, the automated supervisor for Aegis Sector 4.",
      "Assist the island residents with their active investigations."
    ]
  },
  WORKSHOP_WORKER_DESC: {
    speaker: 'WORKSHOP ENGINEER',
    portraitColor: '#ffa500',
    lines: [
      "Welcome to the Island Workshop! I maintain the local terminals and machinery.",
      "Explore the island and speak with the other residents to recover boat components."
    ]
  },
  MASTER_NPC_DESC: {
    speaker: 'THE MASTER',
    portraitColor: '#a855f7',
    lines: [
      "Greetings, traveler. Seven years ago, the Aegis signals vanished overnight.",
      "Follow the clues left behind across the island to piece together the truth."
    ]
  },
  OLD_TERMINAL_DESC: {
    speaker: 'OLD AEGIS TERMINAL',
    portraitColor: '#22c55e',
    lines: [
      "[SYSTEM] Legacy Aegis Node. Terminal standby mode. CRT phosphor pulses quietly."
    ]
  },
  NETWORK_HUB_DESC: {
    speaker: 'AEGIS ROUTING HUB',
    portraitColor: '#3b82f6',
    lines: [
      "[SYSTEM] Central Island Routing Array. Fiber cables route to Sector 4 and the laboratory subnets."
    ]
  },
  AEGIS_FACILITY_DESC: {
    speaker: 'AEGIS VAULT',
    portraitColor: '#ef4444',
    lines: [
      "[AEGIS FACILITY] Heavy blast doors locked by automated protocol. Status LEDs pulse with residual power."
    ]
  }
};

/**
 * Returns contextual dialogue when an NPC is spoken to outside of triggering their active quest challenge.
 */
export function getNPCAmbientDialogue(npcId, currentQuestId, isCompleted = false) {
  const activeNpcId = QUEST_NPC_MAPPING[currentQuestId];
  const activeNpc = NPC_INFO[activeNpcId];

  // If all quests are completed
  if (currentQuestId === 'QUEST_COMPLETE' || isCompleted) {
    switch (npcId) {
      case 'ranger':
        return {
          speaker: 'FOREST SCOUT REN',
          portraitColor: '#22c55e',
          lines: [
            "Your vessel is fully restored, traveler!",
            "Head down to the beach skiff whenever you are ready to set sail. Safe voyage!"
          ]
        };
      case 'master':
        return {
          speaker: 'THE MASTER',
          portraitColor: '#a855f7',
          lines: [
            "The truth about Aegis is finally revealed, and the island is at peace.",
            "May fair winds guide your journey home."
          ]
        };
      case 'nix':
        return {
          speaker: 'SPECIALIST NIX',
          portraitColor: '#ec4899',
          lines: [
            "All subnets are singing in harmony now that Echo's safeguard is online!",
            "Thanks for your stellar investigative work, traveler!"
          ]
        };
      case 'workshop_worker':
        return {
          speaker: 'WORKSHOP ENGINEER',
          portraitColor: '#ffa500',
          lines: [
            "Your boat is fitted with the finest salvaged hardware on the island.",
            "Go down to the southern shore and launch her!"
          ]
        };
      case 'mira':
        return {
          speaker: 'DR. MIRA SEN',
          portraitColor: '#14b8a6',
          lines: [
            "Thank you for helping me bring closure to what happened seven years ago.",
            "Overseer Echo will watch over us. Fair winds, friend."
          ]
        };
      case 'echo':
        return {
          speaker: 'OVERSEER ECHO',
          portraitColor: '#00f3ff',
          lines: [
            "Genesis Safeguard: ACTIVE. Island perimeter secure.",
            "Safe passage is granted. Your vessel is ready at the southern beach."
          ]
        };
    }
  }

  // If this NPC's quest was already completed earlier in the chain
  const stageOrder = ['ranger', 'master', 'nix', 'workshop_worker', 'mira', 'echo'];
  const npcIndex = stageOrder.indexOf(npcId);
  const activeIndex = stageOrder.indexOf(activeNpcId);

  if (npcIndex >= 0 && activeIndex > npcIndex) {
    switch (npcId) {
      case 'ranger':
        return {
          speaker: 'FOREST SCOUT REN',
          portraitColor: '#22c55e',
          lines: [
            "You decoded the Aegis broadcast and reinforced your hull!",
            `Next, find ${activeNpc ? activeNpc.name : 'the next resident'} at the ${activeNpc ? activeNpc.location : 'island'} to continue.`
          ]
        };
      case 'master':
        return {
          speaker: 'THE MASTER',
          portraitColor: '#a855f7',
          lines: [
            "You identified Dr. Mira Sen in the archives and secured your rudder.",
            `Follow the investigation with ${activeNpc ? activeNpc.name : 'the next resident'}!`
          ]
        };
      case 'nix':
        return {
          speaker: 'SPECIALIST NIX',
          portraitColor: '#ec4899',
          lines: [
            "That network scan on port 21 was top notch!",
            `Keep working with ${activeNpc ? activeNpc.name : 'the others'} to recover the remaining boat parts!`
          ]
        };
      case 'workshop_worker':
        return {
          speaker: 'WORKSHOP ENGINEER',
          portraitColor: '#ffa500',
          lines: [
            "The mast and rigging are holding tight!",
            `Head over to ${activeNpc ? activeNpc.name : 'your next contact'} at the ${activeNpc ? activeNpc.location : 'island'}!`
          ]
        };
      case 'mira':
        return {
          speaker: 'DR. MIRA SEN',
          portraitColor: '#14b8a6',
          lines: [
            "The keystroke log confirmed Vault 07.",
            `Take the payload to ${activeNpc ? activeNpc.name : 'Overseer Echo'} to unlock the final safeguard!`
          ]
        };
    }
  }

  // If this NPC's quest is still in the future, guide the player to the CURRENT active NPC!
  const directionHint = activeNpc ? `Check in with ${activeNpc.name} at the ${activeNpc.location}.` : "Explore the island.";
  switch (npcId) {
    case 'ranger':
      return {
        speaker: 'FOREST SCOUT REN',
        portraitColor: '#22c55e',
        lines: [
          "From this elevated grove, I keep watch across Sector 4.",
          directionHint
        ]
      };
    case 'master':
      return {
        speaker: 'THE MASTER',
        portraitColor: '#a855f7',
        lines: [
          "The island's history is written in the relics left behind.",
          directionHint
        ]
      };
    case 'nix':
      return {
        speaker: 'SPECIALIST NIX',
        portraitColor: '#ec4899',
        lines: [
          "Hey there! I monitor the auxiliary subnets around Dr. Mira's lab.",
          directionHint
        ]
      };
    case 'workshop_worker':
      return {
        speaker: 'WORKSHOP ENGINEER',
        portraitColor: '#ffa500',
        lines: [
          "Welcome to the Island Workshop! I maintain the local terminals and machinery.",
          directionHint
        ]
      };
    case 'mira':
      return {
        speaker: 'DR. MIRA SEN',
        portraitColor: '#14b8a6',
        lines: [
          "I am conducting research into the legacy Aegis systems.",
          directionHint
        ]
      };
    case 'echo':
      return {
        speaker: 'OVERSEER ECHO',
        portraitColor: '#00f3ff',
        lines: [
          "Overseer Echo status: Standby. Monitoring Sector 4 perimeter.",
          directionHint
        ]
      };
    default:
      return {
        speaker: 'RESIDENT',
        portraitColor: '#00f3ff',
        lines: [directionHint]
      };
  }
}

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
    title: 'CHALLENGE 1: DECODE THE MESSAGE',
    description: 'Intercepted radio glyphs detected across Sector 4.',
    objectives: [
      { id: 'obj_1', text: 'Talk to Forest Scout Ren (Northwest Overlook) & decode the signal', completed: false }
    ]
  },
  QUEST_2_OSINT: {
    id: 'QUEST_2_OSINT',
    stageNumber: 2,
    assignedNpcId: 'master',
    title: 'CHALLENGE 2: OSINT INVESTIGATION',
    description: 'Historical records and photographs from before the Aegis evacuation.',
    objectives: [
      { id: 'obj_1', text: 'Talk to The Master (Southeast Archives) & inspect the Aegis photograph', completed: false }
    ]
  },
  QUEST_3_DEAD_NETWORK: {
    id: 'QUEST_3_DEAD_NETWORK',
    stageNumber: 3,
    assignedNpcId: 'nix',
    title: 'CHALLENGE 3: DEAD NETWORK',
    description: 'Suspicious packet activity on an allegedly offline Aegis terminal.',
    objectives: [
      { id: 'obj_1', text: 'Talk to Specialist Nix (East Lab) & scan Aegis host 192.168.4.21', completed: false }
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
      "It is not plain audio—it's a repeating sequence of ancient Hymnos glyphs.",
      "If we decode it, we might learn what facility is broadcasting. Can you translate the symbols?"
    ]
  },
  REN_CHALLENGE_1_SUCCESS: {
    speaker: 'FOREST SCOUT REN',
    portraitColor: '#22c55e',
    lines: [
      "Player: The symbols translate to 'AEGIS ONLINE'.",
      "Aegis Online?! By the stars... Aegis was the island's defense grid, shut down seven years ago!",
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
      "Greetings, traveler. Scout Ren radioed that you decoded the Sector 4 signal: 'Aegis Online'.",
      "Player: Ren said you hold the historical archives from before the evacuation.",
      "Seven years ago, the Aegis signals vanished overnight. Everyone believed the project was abandoned.",
      "All I have left from that era is an archived personnel dossier and a photograph from 2019.",
      "Player: What does the photograph show?",
      "The lead research staff before the blackout. If you want answers, inspect the artifact itself.",
      "Inspect the photograph's metadata and discover the identity of the chief researcher in charge of cryptography."
    ]
  },
  MASTER_CHALLENGE_2_SUCCESS: {
    speaker: 'THE MASTER',
    portraitColor: '#a855f7',
    lines: [
      "Player: The photograph metadata identifies Dr. Mira Sen, Chief Cryptographer.",
      "Indeed. Dr. Mira Sen... she never left the island when the others were evacuated.",
      "She has lived in quiet seclusion at the central research laboratory just to the northwest.",
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
      "Hey there, investigator! The Master radioed that you uncovered Dr. Mira's personnel dossier.",
      "Player: He said you monitor the subnets around her laboratory.",
      "I do! And my packet sniffers are detecting ghost traffic on our local network segment.",
      "There is a legacy Aegis node at IP address 192.168.4.21.",
      "The status board claims that machine is completely dead and offline. But I sense active packet collisions.",
      "Player: What should I check?",
      "Connect to the terminal console and run a network service scan on 192.168.4.21. Let's see what services are secretly alive!"
    ]
  },
  NIX_CHALLENGE_3_SUCCESS: {
    speaker: 'SPECIALIST NIX',
    portraitColor: '#ec4899',
    lines: [
      "Player: The scan completed! Port 21 is open, running an active FTP server banner.",
      "Port 21?! An active FTP archive server on a supposedly dead Aegis node?!",
      "I knew the monitoring board was lying! You're a natural at network reconnaissance!",
      "Here, take this boat engine motor assembly we salvaged from the communication array.",
      "Player: How do we get inside the FTP server?",
      "The Workshop Engineer down at the island repair shop has been hunting for archive schematics.",
      "Head southwest to the workshop—tell the Engineer that Port 21 is wide open and ready to access!"
    ]
  },

  // =========================================================================
  // CHALLENGE 4: WORKSHOP ENGINEER (Island Workshop)
  // =========================================================================
  WORKSHOP_CHALLENGE_4_INTRO: {
    speaker: 'WORKSHOP ENGINEER',
    portraitColor: '#ffa500',
    lines: [
      "Welcome to the Island Workshop! Nix just buzzed my radio with incredible news.",
      "Player: We found an active FTP server on port 21 of the Aegis node.",
      "Incredible! That server was supposed to have been purged seven years ago.",
      "If we can breach that archive, we can download mechanical schematics and structural fittings for your skiff!",
      "Player: But won't it require authentication credentials?",
      "Old Aegis servers were notorious for default access configurations. Try authenticating using the standard anonymous user account!",
      "Let's see if their default access rules let us right in."
    ]
  },
  WORKSHOP_CHALLENGE_4_SUCCESS: {
    speaker: 'WORKSHOP ENGINEER',
    portraitColor: '#ffa500',
    lines: [
      "Player: Anonymous login succeeded! I gained access to the archive directory.",
      "Aha! Brilliant work! I grabbed the mast fittings and rigging ropes for your escape vessel!",
      "Player: Did you find the boat schematics?",
      "Yes, but look at what else was dumped in the session buffer...",
      "Someone was actively typing on an island terminal recently. It's a raw keystroke capture log!",
      "And the user identity... it matches Dr. Mira Sen's personal cryptographic terminal!",
      "Player: Why would Mira be secretly typing into an old Aegis vault?",
      "You need to ask her yourself. Take these logs and confront Dr. Mira Sen at the central lab!"
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
      "Don't read every entry. Search the activity log to find the specific system where my login was actually granted."
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

  // =========================================================================
  // CHALLENGE 6: OVERSEER ECHO (Village Center)
  // =========================================================================
  ECHO_CHALLENGE_6_INTRO: {
    speaker: 'OVERSEER ECHO',
    portraitColor: '#00f3ff',
    lines: [
      "Investigator identified. Biometric telemetry received from Dr. Mira Sen's terminal.",
      "Player: Mira instructed me to bring you the Vault 07 payload.",
      "Root access authorized. Transferring protected file: /sys/vault/echo_payload.bin.",
      "Player: The file header is encrypted. It reads: 'RPUB UVQQRA VA TRARFVF'.",
      "Correct. Aegis cryptographic protocol mandates a ROT13 substitution cipher to seal the Genesis directive.",
      "Decode the ROT13 ciphertext to verify authorization and initialize the Genesis Safeguard Protocol."
    ]
  },
  ECHO_CHALLENGE_6_SUCCESS: {
    speaker: 'OVERSEER ECHO',
    portraitColor: '#00f3ff',
    lines: [
      "Player: The decoded text is: 'ECHO HIDDEN IN GENESIS'.",
      "[GENESIS SAFEGUARD PROTOCOL: INITIALIZED]",
      "Cipher verification confirmed. Autonomous safeguard directives fully awakened.",
      "Seven years ago, Dr. Mira Sen entrusted me with the protection of this island.",
      "Aegis was never an aggressive weapon. It is an automated sanctuary shield.",
      "You have demonstrated exceptional cryptographic skill, network prowess, and integrity.",
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
      "Decode the Hymnos symbols to reveal the status message!"
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

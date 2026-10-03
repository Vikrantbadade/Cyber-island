// Centralized Story, Quest & Dialogue Data Registry for CyberIsland: Aegis Mystery

export const QUESTS = {
  QUEST_1_DECODE_MESSAGE: {
    id: 'QUEST_1_DECODE_MESSAGE',
    title: 'CHALLENGE 1: DECODE THE MESSAGE',
    description: 'Investigate the strange symbolic alphabet message recovered from Sector 4.',
    objectives: [
      { id: 'obj_1', text: 'Talk to Mira & decode the symbolic alphabet message', completed: false }
    ]
  },
  QUEST_2_OSINT: {
    id: 'QUEST_2_OSINT',
    title: 'CHALLENGE 2: OSINT INVESTIGATION',
    description: 'Examine the old photograph connected to the Aegis facility.',
    objectives: [
      { id: 'obj_1', text: 'Check the image and discover information about Mira Sen', completed: false }
    ]
  },
  QUEST_3_DEAD_NETWORK: {
    id: 'QUEST_3_DEAD_NETWORK',
    title: 'CHALLENGE 3: DEAD NETWORK',
    description: 'Investigate the old Aegis terminal and discover active host services.',
    objectives: [
      { id: 'obj_1', text: 'Scan the network host and discover reachable services', completed: false }
    ]
  },
  QUEST_4_ABNORMAL_SERVER: {
    id: 'QUEST_4_ABNORMAL_SERVER',
    title: 'CHALLENGE 4: ABNORMAL SERVER',
    description: 'Access the unexpected active server on the abandoned Aegis node.',
    objectives: [
      { id: 'obj_1', text: 'Try to access/hack the server anonymously', completed: false }
    ]
  },
  QUEST_5_KEYLOGGER_INCIDENT: {
    id: 'QUEST_5_KEYLOGGER_INCIDENT',
    title: 'CHALLENGE 5: KEYLOGGER INCIDENT',
    description: 'Search the keyboard activity log to find proof of a successful login.',
    objectives: [
      { id: 'obj_1', text: 'Search the log for a successful login record', completed: false }
    ]
  },
  QUEST_6_SUSPICIOUS_FILE: {
    id: 'QUEST_6_SUSPICIOUS_FILE',
    title: 'CHALLENGE 6: SUSPICIOUS FILE',
    description: 'Investigate the hidden file and break the substitution cipher.',
    objectives: [
      { id: 'obj_1', text: 'Inspect the suspicious file and decode the cipher', completed: false }
    ]
  },
  QUEST_COMPLETE: {
    id: 'QUEST_COMPLETE',
    title: 'THE AEGIS MYSTERY UNRAVELED',
    description: 'You have uncovered the truth about Aegis, Mira, and ECHO. The mystery is solved!',
    objectives: [
      { id: 'obj_1', text: 'All 6 challenges completed successfully', completed: true }
    ]
  }
};

export const DIALOGUES = {
  // CHALLENGE 1 DIALOGUES
  MIRA_CHALLENGE_1_INTRO: {
    speaker: 'MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "I've seen those symbols before.",
      "Player: You know what this is?",
      "Not exactly. But they're not random.",
      "Player: So how do I decode it?",
      "Start with the alphabet. Find out what each symbol represents."
    ]
  },

  // CHALLENGE 2 DIALOGUES
  MIRA_CHALLENGE_2_INTRO: {
    speaker: 'MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "That photograph was taken before Aegis disappeared.",
      "Player: Who's the woman?",
      "Her name is Mira Sen.",
      "Player: You know her?",
      "I knew her.",
      "If you want answers, don't trust what people tell you.",
      "Look at what they left behind."
    ]
  },

  // CHALLENGE 3 DIALOGUES
  MIRA_CHALLENGE_3_INTRO: {
    speaker: 'MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "That machine shouldn't be communicating with anything.",
      "Player: But you think it is?",
      "I think the status screen is lying.",
      "Player: What should I check?",
      "The network."
    ]
  },

  // CHALLENGE 4 DIALOGUES
  MIRA_CHALLENGE_4_INTRO: {
    speaker: 'MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "Player: I found an FTP server.",
      "That's impossible.",
      "Player: Why?",
      "Because that server was supposed to be gone.",
      "Seven years.",
      "Player: What?",
      "That's how long they've said this place has been dead.",
      "Something doesn't add up."
    ]
  },

  // CHALLENGE 5 DIALOGUES
  MIRA_CHALLENGE_5_INTRO: {
    speaker: 'MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "Player: Mira... what is this?",
      "A mistake.",
      "Player: Whose mistake?",
      "Mine.",
      "Player: This contains keyboard activity.",
      "Yes.",
      "Player: So someone captured what was being typed?",
      "That's what it looks like.",
      "Player: There's too much information here.",
      "Then don't read everything.",
      "Player: What should I look for?",
      "Something that proves a login actually worked."
    ]
  },
  MIRA_CHALLENGE_5_POST: {
    speaker: 'MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "Player: I found a successful login.",
      "Where?",
      "Player: An old Aegis system.",
      "...",
      "Player: You logged into it.",
      "Yes.",
      "Player: When?",
      "After Aegis was supposedly shut down."
    ]
  },

  // CHALLENGE 6 DIALOGUES
  MIRA_CHALLENGE_6_INTRO: {
    speaker: 'MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "Player: Mira, I found something.",
      "What?",
      "Player: A file. I don't know what it is.",
      "Don't run it.",
      "Player: Why?",
      "Because if someone wanted to hide something inside an old system, that's exactly where I'd expect it.",
      "Aegis didn't trust plain text.",
      "Player: Encryption?",
      "Sometimes.",
      "Player: Then what?",
      "Sometimes they used something simpler.",
      "Player: A substitution?",
      "Maybe."
    ]
  },
  MIRA_STORY_COMPLETE: {
    speaker: 'MIRA SEN',
    portraitColor: '#14b8a6',
    lines: [
      "You decoded ECHO's payload message! Aegis was never truly offline...",
      "ECHO was an autonomous safeguard system created seven years ago to monitor the island grid.",
      "Thank you for uncovering the truth about what happened here."
    ]
  },

  // OTHER NPCS & LANDMARKS
  OVERSEER_ECHO_DESC: {
    speaker: 'OVERSEER ECHO',
    portraitColor: '#00f3ff',
    lines: [
      "I am Overseer Echo, the automated supervisor for Aegis Sector 4.",
      "Assist Dr. Mira Sen at the central lab to investigate the active signals."
    ]
  },
  WORKSHOP_WORKER_DESC: {
    speaker: 'WORKSHOP ENGINEER',
    portraitColor: '#ffa500',
    lines: [
      "Welcome to the Island Workshop! I maintain the local terminals.",
      "Dr. Mira Sen is conducting an investigation into the old Aegis facility."
    ]
  },
  MASTER_NPC_DESC: {
    speaker: 'THE MASTER',
    portraitColor: '#a855f7',
    lines: [
      "Greetings, investigator. Seven years ago, the Aegis signals vanished overnight.",
      "Seek out Dr. Mira Sen at the central sanctuary to begin your investigation."
    ]
  },
  OLD_TERMINAL_DESC: {
    speaker: 'OLD AEGIS TERMINAL',
    portraitColor: '#22c55e',
    lines: [
      "[SYSTEM] Legacy Aegis Node. Terminal standby mode."
    ]
  },
  NETWORK_HUB_DESC: {
    speaker: 'AEGIS ROUTING HUB',
    portraitColor: '#3b82f6',
    lines: [
      "[SYSTEM] Central Island Routing Array. Fiber cables route to Aegis Sector 4."
    ]
  },
  AEGIS_FACILITY_DESC: {
    speaker: 'AEGIS VAULT',
    portraitColor: '#ef4444',
    lines: [
      "[AEGIS FACILITY] Supposedly shut down 7 years ago... yet status LEDs are blinking."
    ]
  }
};

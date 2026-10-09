import { TOTAL_STAGES } from '../utils/progress';

/**
 * Server-side game content: score, accepted answers and hint texts for every stage.
 *
 * This file is the ONLY place answers and hint texts live. The browser never receives them:
 *   - answers are checked by POST /api/team/stages/:id/submit
 *   - a hint text is returned only after the team has paid for it (POST .../hint), and by
 *     GET /api/team/progress for hints the team has already unlocked
 *
 * Editing this file changes scores / penalties / texts; run "Initialize game data" in the admin page
 * (or `pnpm seed`) afterwards so the database picks up scores and hint penalties. Answers and hint texts are
 * read from here at request time.
 *
 * Answers are compared case-insensitively with surrounding whitespace removed and inner whitespace collapsed
 * (see normalizeAnswer). List every accepted spelling.
 */

export interface HintConfig {
  text: string;
  /** Points deducted when the team unlocks this hint. */
  penalty: number;
}

export interface StageConfig {
  /** Points awarded when the stage is solved. */
  score: number;
  /** Accepted answers (normalized before comparing). */
  answers: string[];
  /** Ordered hints; hint N is unlocked after hints 1..N-1. */
  hints: HintConfig[];
}

/** Index 0 = stage 1. Must contain exactly TOTAL_STAGES entries. */
export const STAGES: StageConfig[] = [
  // 1: The Hidden Message (Hymnos alphabet)
  {
    score: 100,
    answers: ['Suraksha{Y0u_5ucc3ssfully_D3crYpt3d_Th3_3ncrYpt3d_Symb0l1c_L4Ngu4g3}'],
    hints: [
      {
        text: 'Hint: Identify the alphabet and use this reference to decode the message: https://www.dcode.fr/alphabet-hymnos',
        penalty: 5,
      },
    ],
  },
  // 2: OSINT investigation
  {
    score: 150,
    answers: ['Suraksha{trainingpartner_supportpartner_supportpartner}'],
    hints: [
      {
        text: "Hint: Check every account belonging to Mira.",
        penalty: 5,
      },
    ],
  },
  // 3: Dead network (service discovery)
{
  score: 100,
  answers: [
    'SURAKSHA{443_OPEN}'
  ],
  hints: [
    {
      text: "Hint 2: Use Nmap to scan port 443 on google.com.",
      penalty: 10,
    },
  ],
},
  // 4: Abnormal server (anonymous FTP)
  {
    score: 100,
    answers: ['Suraksha{21_ANONYMOUS}','Suraksha{21_anonymous}','Suraksha{21_Anonymous}'],
    hints: [
      {
        text: 'Hint: nmap -A <TARGET_IP>',
        penalty: 5,
      },
    ],
  },
  // 5: Keylogger incident
  {
    score: 100,
    answers: ['Suraksha{M!ra_P@$Sw03d}'],
    hints: [
      {
        text: "Hint: Search for successful login indicators in the log.",
        penalty: 15,
      },
    ],
  },
  // 6: Suspicious file (ROT13)
  {
    score: 100,
    answers: ['Suraksha{41.35159202046095_-4.688732531073598}'],
    hints: [
        {
        text: "Hint: Get in touch with Puchero for clues about the location.",
        penalty: 20,
      },
    ],
  },
];

if (STAGES.length !== TOTAL_STAGES) {
  throw new Error(`config/stages.ts defines ${STAGES.length} stages but TOTAL_STAGES is ${TOTAL_STAGES}`);
}

export function getStageConfig(stageId: number): StageConfig {
  const cfg = STAGES[stageId - 1];
  if (!cfg) throw new Error(`No stage config for stage ${stageId}`);
  return cfg;
}

export function normalizeAnswer(input: string): string {
  return input.normalize('NFKC').trim().replace(/\s+/g, ' ').toUpperCase();
}

export function isCorrectAnswer(stageId: number, input: string): boolean {
  const given = normalizeAnswer(input);
  if (given === '') return false;
  return getStageConfig(stageId).answers.some((a) => normalizeAnswer(a) === given);
}

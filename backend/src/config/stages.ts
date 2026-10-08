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
  // 1: Decode the message (Hymnos alphabet)
  {
    score: 100,
    answers: ['AEGIS ONLINE', 'AEGISONLINE'],
    hints: [
      {
        text: 'Hint: Use this site to decode the message: https://www.dcode.fr/hymnos-alphabet',
        penalty: 5,
      },
    ],
  },
  // 2: OSINT investigation
  {
    score: 100,
    answers: ['MIRA SEN', 'MIRA'],
    hints: [
      {
        text: "Hint: Inspect the photograph details left behind prior to Aegis's disappearance.",
        penalty: 5,
      },
    ],
  },
  // 3: Dead network (service discovery)
  {
    score: 100,
    answers: ['SCAN', 'NMAP', '21', 'PORT 21', 'FTP'],
    hints: [
      {
        text: "Hint: Type 'scan' or 'nmap' to perform network service discovery on host 192.168.4.21.",
        penalty: 5,
      },
    ],
  },
  // 4: Abnormal server (anonymous FTP)
  {
    score: 100,
    answers: ['ANONYMOUS', 'FTP ANONYMOUS', 'USER ANONYMOUS'],
    hints: [
      {
        text: 'Hint: Attempt authentication using the standard anonymous user account.',
        penalty: 5,
      },
    ],
  },
  // 5: Keylogger incident
  {
    score: 100,
    answers: ['AEGIS-VAULT-07', 'AEGIS-VAULT', 'GREP SUCCESS'],
    hints: [
      {
        text: "Hint: Use CLI search commands (e.g. 'grep success' or search for 'aegis-vault-07').",
        penalty: 5,
      },
    ],
  },
  // 6: Suspicious file (ROT13)
  {
    score: 100,
    answers: ['ECHO HIDDEN IN GENESIS', 'ECHO'],
    hints: [
      {
        text: 'Hint: Aegis used ROT13 substitution to encode the payload header.',
        penalty: 5,
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

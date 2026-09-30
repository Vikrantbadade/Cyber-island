/**
 * PLACEHOLDER seed values. Edit before the event.
 *
 * Stages (per design doc): 1..12, sequential, stage 12 = Escape.
 * Hints: each stage can have N ordered hints; later hints cost more.
 *
 * Teams: either edit SAMPLE_TEAMS below or drop a `prisma/teams.json` file:
 *   [{ "name": "Team Alpha", "loginName": "alpha", "password": "pw123" }, ...]
 * teams.json takes precedence over SAMPLE_TEAMS when present.
 */

export const STAGE_SCORES: Record<number, number> = {
  1: 100,
  2: 100,
  3: 100,
  4: 100,
  5: 100,
  6: 100,
  7: 100,
  8: 100,
  9: 100,
  10: 100,
  11: 100,
  12: 100,
};

/** Penalties for hint_order 1,2,3 — applied identically to every stage by default. */
export const DEFAULT_HINT_PENALTIES = [5, 10, 20];

/** Optional per-stage override: stageId -> penalties array (index 0 = hint_order 1). */
export const HINT_PENALTY_OVERRIDES: Record<number, number[]> = {
  // 12: [10, 25, 50],
};

export interface SeedTeam {
  name: string;
  loginName: string;
  password: string;
}

export const SAMPLE_TEAMS: SeedTeam[] = [
  { name: 'Team Alpha', loginName: 'alpha', password: 'alpha123' },
  { name: 'Team Bravo', loginName: 'bravo', password: 'bravo123' },
  { name: 'Team Charlie', loginName: 'charlie', password: 'charlie123' },
];

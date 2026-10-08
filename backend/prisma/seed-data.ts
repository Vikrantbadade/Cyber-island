/**
 * Teams for the `pnpm seed` CLI (development / tests only).
 *
 * Stage scores, hint penalties, answers and hint texts are NOT here any more: they live in
 * src/config/stages.ts. For the real event, initialize the game data and import teams from the admin page.
 *
 * `pnpm seed` uses prisma/teams.json when it exists (keep that file out of git; it holds plaintext passwords),
 * otherwise SAMPLE_TEAMS below. The integration tests expect the sample teams (alpha / bravo / charlie).
 */

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

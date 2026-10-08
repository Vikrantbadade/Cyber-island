/**
 * Developer CLI: `pnpm seed`. Same logic as the admin page's "Initialize game data" + "Import teams"
 * (src/services/seed.service.ts). It is NOT run automatically when the Docker container starts.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';
import { importTeams, initializeGameData } from '../src/services/seed.service';
import { SAMPLE_TEAMS, SeedTeam } from './seed-data';

function loadTeams(): SeedTeam[] {
  const file = path.join(__dirname, 'teams.json');
  if (fs.existsSync(file)) {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as SeedTeam[];
    console.log(`Using ${parsed.length} teams from prisma/teams.json`);
    return parsed;
  }
  console.log(`prisma/teams.json not found, using ${SAMPLE_TEAMS.length} sample teams`);
  return SAMPLE_TEAMS;
}

async function main() {
  const status = await initializeGameData({ force: true });
  console.log(
    `Game data ready: ${status.stages}/${status.expectedStages} stages, ${status.hints}/${status.expectedHints} hints`,
  );

  const result = await importTeams(loadTeams());
  console.log(`Teams: ${result.created} created, ${result.updated} updated`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

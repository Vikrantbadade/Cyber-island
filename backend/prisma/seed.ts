import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_HINT_PENALTIES,
  HINT_PENALTY_OVERRIDES,
  SAMPLE_TEAMS,
  STAGE_SCORES,
  SeedTeam,
} from './seed-data';

const prisma = new PrismaClient();

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
  // Contest singleton (never overwrite live state on re-seed)
  await prisma.contest.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      status: 'NOT_STARTED',
      durationMinutes: Number(process.env.CONTEST_DURATION_MINUTES ?? 180),
      timezone: process.env.CONTEST_TIMEZONE ?? 'Asia/Kolkata',
      graceSeconds: Number(process.env.CONTEST_GRACE_SECONDS ?? 2),
    },
  });

  // 12 stages + hints
  for (let stageId = 1; stageId <= 12; stageId++) {
    await prisma.stageMeta.upsert({
      where: { stageId },
      update: { stageScore: STAGE_SCORES[stageId] },
      create: { stageId, stageScore: STAGE_SCORES[stageId] },
    });

    const penalties = HINT_PENALTY_OVERRIDES[stageId] ?? DEFAULT_HINT_PENALTIES;
    for (let i = 0; i < penalties.length; i++) {
      const hintOrder = i + 1;
      await prisma.stageHint.upsert({
        where: { stageId_hintOrder: { stageId, hintOrder } },
        update: { penalty: penalties[i] },
        create: { stageId, hintOrder, penalty: penalties[i] },
      });
    }
    // Remove hints beyond the configured count
    await prisma.stageHint.deleteMany({
      where: { stageId, hintOrder: { gt: penalties.length } },
    });
  }

  // Teams + progress + hint progress rows (existing teams keep their state)
  const teams = loadTeams();
  for (const t of teams) {
    const team = await prisma.team.upsert({
      where: { loginName: t.loginName },
      update: { name: t.name, passwordPlaintext: t.password },
      create: { name: t.name, loginName: t.loginName, passwordPlaintext: t.password },
    });

    await prisma.teamProgress.upsert({
      where: { teamId: team.id },
      update: {},
      create: { teamId: team.id },
    });

    await prisma.teamHintProgress.createMany({
      data: Array.from({ length: 12 }, (_, i) => ({
        teamId: team.id,
        stageId: i + 1,
        hintsUsedCount: 0,
      })),
      skipDuplicates: true,
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

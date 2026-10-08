import { STAGES } from '../config/stages';
import { env } from '../config/env';
import { conflict } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { TOTAL_STAGES } from '../utils/progress';
import { reconcileTeamRows } from './team-integrity.service';

/**
 * Manual database setup, driven from the admin page (POST /api/admin/setup/*) or the `pnpm seed` CLI.
 * Nothing here runs automatically when the container starts.
 */

export interface SetupTeam {
  name: string;
  loginName: string;
  password: string;
}

const EXPECTED_HINTS = STAGES.reduce((sum, s) => sum + s.hints.length, 0);

export async function getSetupStatus() {
  const [contest, stages, hints, teams] = await Promise.all([
    prisma.contest.findUnique({ where: { id: 1 }, select: { id: true } }),
    prisma.stageMeta.count(),
    prisma.stageHint.count(),
    prisma.team.count(),
  ]);
  return {
    initialized: contest !== null && stages === TOTAL_STAGES && hints === EXPECTED_HINTS,
    contestExists: contest !== null,
    stages,
    expectedStages: TOTAL_STAGES,
    hints,
    expectedHints: EXPECTED_HINTS,
    teams,
  };
}

/**
 * Create / sync the contest record, stages, scores and hint penalties from config/stages.ts.
 * Idempotent. Never touches teams, progress, scores or the live contest state.
 * Refused while the contest is RUNNING unless `force` is set (CLI use).
 */
export async function initializeGameData(opts: { force?: boolean } = {}) {
  const existing = await prisma.contest.findUnique({ where: { id: 1 } });
  if (existing?.status === 'RUNNING' && !opts.force) {
    throw conflict('Game data cannot be re-initialized while the contest is RUNNING');
  }

  await prisma.$transaction(async (tx) => {
    const settings = {
      durationMinutes: env.CONTEST_DURATION_MINUTES,
      timezone: env.CONTEST_TIMEZONE,
      graceSeconds: env.CONTEST_GRACE_SECONDS,
    };
    await tx.contest.upsert({
      where: { id: 1 },
      // Before the contest starts, pick up changed .env settings; once it has started never overwrite live state
      update: existing && existing.status !== 'NOT_STARTED' ? {} : settings,
      create: { id: 1, status: 'NOT_STARTED', ...settings },
    });

    // Stages beyond the configured count are removed (cascades to their hints and per-team hint rows)
    await tx.stageMeta.deleteMany({ where: { stageId: { gt: TOTAL_STAGES } } });

    for (let i = 0; i < TOTAL_STAGES; i++) {
      const stageId = i + 1;
      const cfg = STAGES[i];
      await tx.stageMeta.upsert({
        where: { stageId },
        update: { stageScore: cfg.score },
        create: { stageId, stageScore: cfg.score },
      });
      for (let h = 0; h < cfg.hints.length; h++) {
        const hintOrder = h + 1;
        await tx.stageHint.upsert({
          where: { stageId_hintOrder: { stageId, hintOrder } },
          update: { penalty: cfg.hints[h].penalty },
          create: { stageId, hintOrder, penalty: cfg.hints[h].penalty },
        });
      }
      await tx.stageHint.deleteMany({ where: { stageId, hintOrder: { gt: cfg.hints.length } } });
    }
  });

  // Existing teams need a hint-progress row for every stage
  const backfilledRows = await reconcileTeamRows();
  return { ...(await getSetupStatus()), backfilledRows };
}

/**
 * Create teams, or update name + password for login IDs that already exist.
 * Progress, score and penalty of existing teams are never touched. Teams missing from the list are NOT deleted.
 */
export async function importTeams(teams: SetupTeam[]) {
  const existing = await prisma.team.findMany({
    where: { loginName: { in: teams.map((t) => t.loginName) } },
    select: { id: true, loginName: true },
  });
  const idByLogin = new Map(existing.map((t) => [t.loginName, t.id]));

  let created = 0;
  let updated = 0;
  await prisma.$transaction(
    async (tx) => {
      for (const t of teams) {
        const id = idByLogin.get(t.loginName);
        if (id) {
          await tx.team.update({ where: { id }, data: { name: t.name, passwordPlaintext: t.password } });
          updated++;
        } else {
          await tx.team.create({ data: { name: t.name, loginName: t.loginName, passwordPlaintext: t.password } });
          created++;
        }
      }
    },
    { timeout: 60_000 },
  );

  // Progress + hint rows for the new teams in one bulk insert (the DB trigger usually did it already)
  await reconcileTeamRows();
  return { created, updated, total: teams.length };
}

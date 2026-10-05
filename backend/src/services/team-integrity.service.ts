import type { Prisma } from '@prisma/client';
import { notFound } from '../lib/errors';
import { prisma } from '../lib/prisma';

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Every team needs one team_progress row and one team_hint_progress row per stage.
 * Only the seed script and admin team creation used to create them, so a team inserted straight into
 * the database had none and every stage completion / hint call for it failed.
 *
 * Idempotent and race-safe (skipDuplicates = INSERT ... ON CONFLICT DO NOTHING).
 */
export async function ensureTeamRows(db: Db, teamId: string) {
  const team = await db.team.findUnique({ where: { id: teamId }, select: { id: true } });
  if (!team) throw notFound('Team not found');

  const stages = await db.stageMeta.findMany({ select: { stageId: true } });
  await db.teamProgress.createMany({ data: [{ teamId }], skipDuplicates: true });
  await db.teamHintProgress.createMany({
    data: stages.map((s) => ({ teamId, stageId: s.stageId, hintsUsedCount: 0 })),
    skipDuplicates: true,
  });
}

/** Backfill missing progress rows for ALL teams (teams added by hand while the app was down, etc). */
export async function reconcileTeamRows(): Promise<number> {
  const [teams, stages] = await Promise.all([
    prisma.team.findMany({ select: { id: true } }),
    prisma.stageMeta.findMany({ select: { stageId: true } }),
  ]);
  if (teams.length === 0) return 0;

  const progress = await prisma.teamProgress.createMany({
    data: teams.map((t) => ({ teamId: t.id })),
    skipDuplicates: true,
  });
  const hints = await prisma.teamHintProgress.createMany({
    data: teams.flatMap((t) => stages.map((s) => ({ teamId: t.id, stageId: s.stageId, hintsUsedCount: 0 }))),
    skipDuplicates: true,
  });
  return progress.count + hints.count;
}

/**
 * Database trigger: a plain `INSERT INTO teams (...)` (psql, Prisma Studio, a DB GUI, a script) now creates the
 * team's progress rows in the same transaction, so a hand-added team is playable immediately.
 * `prisma db push` does not manage triggers, so this is (re)installed on every backend start. Idempotent.
 */
export async function installTeamTriggers() {
  await prisma.$transaction([
    prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION cyberisland_init_team() RETURNS trigger AS $fn$
      BEGIN
        INSERT INTO team_progress (team_id) VALUES (NEW.id) ON CONFLICT (team_id) DO NOTHING;
        INSERT INTO team_hint_progress (team_id, stage_id, hints_used_count)
          SELECT NEW.id, stage_id, 0 FROM stage_meta
          ON CONFLICT (team_id, stage_id) DO NOTHING;
        RETURN NULL;
      END;
      $fn$ LANGUAGE plpgsql
    `),
    prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS cyberisland_init_team ON teams'),
    prisma.$executeRawUnsafe(
      'CREATE TRIGGER cyberisland_init_team AFTER INSERT ON teams FOR EACH ROW EXECUTE FUNCTION cyberisland_init_team()',
    ),
  ]);
}

/** Boot-time setup. Never fatal: the lazy ensureTeamRows() calls still protect the game paths. */
export async function prepareTeamIntegrity() {
  try {
    await installTeamTriggers();
    const created = await reconcileTeamRows();
    console.log(`Team integrity ready (trigger installed, ${created} missing progress rows backfilled)`);
  } catch (err) {
    console.error('Team integrity setup failed (continuing; rows are still created lazily):', err);
  }
}

import type { Prisma } from '@prisma/client';
import { conflict, notFound } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { TOTAL_STAGES, elapsedArray, nextStageOf } from '../utils/progress';
import { getContestElapsedSeconds, getNow } from '../utils/time';
import { assertMutationAllowed, getContest } from './contest.service';
import { ensureTeamRows } from './team-integrity.service';

type Tx = Prisma.TransactionClient;

export function parseStageId(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > TOTAL_STAGES) throw notFound(`Unknown stage: ${String(raw)}`);
  return n;
}

export async function getTeamProfile(teamId: string) {
  const t = await prisma.team.findUnique({ where: { id: teamId } });
  if (!t) throw notFound('Team not found');
  return { id: t.id, name: t.name, loginName: t.loginName, score: t.score, penalty: t.penalty };
}

export async function getTeamProgress(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { progress: true, hintProgress: true },
  });
  if (!team) throw notFound('Team not found');

  const hintCounts = await prisma.stageHint.groupBy({ by: ['stageId'], _count: { _all: true } });
  const available = new Map(hintCounts.map((h) => [h.stageId, h._count._all]));
  const used = new Map(team.hintProgress.map((h) => [h.stageId, h.hintsUsedCount]));
  const elapsed = elapsedArray(team.progress);

  return {
    teamId: team.id,
    score: team.score,
    penalty: team.penalty,
    netScore: team.score - team.penalty,
    completedStages: elapsed.flatMap((e, i) => (e !== null ? [i + 1] : [])),
    nextStage: nextStageOf(team.progress),
    stages: elapsed.map((e, i) => ({
      stageId: i + 1,
      completedElapsedSeconds: e,
      hintsUsed: used.get(i + 1) ?? 0,
      hintsAvailable: available.get(i + 1) ?? 0,
    })),
  };
}

/**
 * Core sequential-completion write. MUST run inside a transaction.
 * The conditional updateMany makes it race-safe: double submits and skips match 0 rows -> 409.
 */
export async function applyStageCompletion(tx: Tx, teamId: string, stageId: number, elapsedSeconds: number) {
  const meta = await tx.stageMeta.findUnique({ where: { stageId } });
  if (!meta) throw notFound(`Unknown stage: ${stageId}`);

  await ensureTeamRows(tx, teamId); // no-op for normal teams; heals teams inserted by hand

  const col = `stage${stageId}CompletedElapsed`;
  const where: Record<string, unknown> = { teamId, [col]: null };
  if (stageId > 1) where[`stage${stageId - 1}CompletedElapsed`] = { not: null };

  const { count } = await tx.teamProgress.updateMany({
    where: where as Prisma.TeamProgressWhereInput,
    data: { [col]: elapsedSeconds } as Prisma.TeamProgressUpdateManyMutationInput,
  });
  if (count === 0) {
    const p = await tx.teamProgress.findUnique({ where: { teamId } });
    if (!p) throw notFound('Team progress not found');
    const done = (elapsedArray(p)[stageId - 1] ?? null) !== null;
    throw conflict(done ? `Stage ${stageId} already completed` : `Stage ${stageId} is not the next stage`);
  }

  await tx.team.update({ where: { id: teamId }, data: { score: { increment: meta.stageScore } } });
}

export async function completeNextStage(teamId: string, rawStageId: unknown) {
  const stageId = parseStageId(rawStageId);
  await prisma.$transaction(async (tx) => {
    const contest = assertMutationAllowed(await getContest(tx));
    const elapsed = getContestElapsedSeconds(contest.startAt, getNow());
    await applyStageCompletion(tx, teamId, stageId, elapsed);
  });
  return getTeamProgress(teamId);
}

export async function useNextHint(teamId: string, rawStageId: unknown) {
  const stageId = parseStageId(rawStageId);

  const result = await prisma.$transaction(async (tx) => {
    assertMutationAllowed(await getContest(tx));
    await ensureTeamRows(tx, teamId);

    const progress = await tx.teamProgress.findUnique({ where: { teamId } });
    if (!progress) throw notFound('Team progress not found');
    const reached = nextStageOf(progress) ?? TOTAL_STAGES;
    if (stageId > reached) throw conflict(`Stage ${stageId} has not been reached yet`);

    await tx.teamHintProgress.createMany({ data: [{ teamId, stageId, hintsUsedCount: 0 }], skipDuplicates: true });
    const hp = await tx.teamHintProgress.findUniqueOrThrow({ where: { teamId_stageId: { teamId, stageId } } });

    const hint = await tx.stageHint.findUnique({
      where: { stageId_hintOrder: { stageId, hintOrder: hp.hintsUsedCount + 1 } },
    });
    if (!hint) throw conflict(`No more hints available for stage ${stageId}`);

    // Optimistic guard against concurrent double-requests
    const { count } = await tx.teamHintProgress.updateMany({
      where: { teamId, stageId, hintsUsedCount: hp.hintsUsedCount },
      data: { hintsUsedCount: { increment: 1 } },
    });
    if (count === 0) throw conflict('Concurrent hint request, retry');

    const team = await tx.team.update({ where: { id: teamId }, data: { penalty: { increment: hint.penalty } } });
    return {
      stageId,
      hintOrder: hint.hintOrder,
      hintsUsed: hp.hintsUsedCount + 1,
      penaltyApplied: hint.penalty,
      penalty: team.penalty,
      score: team.score,
      netScore: team.score - team.penalty,
    };
  });

  return result;
}

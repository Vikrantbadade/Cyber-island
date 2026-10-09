import { conflict, notFound } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { toCsv } from '../utils/csv';
import { getNow } from '../utils/time';
import { rankTeams } from './admin-team.service';
import { getContest } from './contest.service';

/** Freeze the leaderboard into an immutable snapshot. Only allowed once, after the contest has ENDED. */
export async function finalizeOfficialResults() {
  const contest = await getContest();
  if (contest.status !== 'ENDED') throw conflict('Contest must be ENDED before finalizing results');
  if (contest.resultsFinalizedAt) throw conflict('Results already finalized');

  const ranked = await rankTeams();

  const snapshot = await prisma.$transaction(async (tx) => {
    // Guard against concurrent finalize calls
    const { count } = await tx.contest.updateMany({
      where: { id: 1, resultsFinalizedAt: null },
      data: { resultsFinalizedAt: getNow() },
    });
    if (count === 0) throw conflict('Results already finalized');

    const snap = await tx.officialResultSnapshot.create({ data: { contestId: 1 } });
    await tx.officialResultRow.createMany({
      data: ranked.map((r) => ({
        snapshotId: snap.id,
        rank: r.rank,
        teamId: r.id,
        teamName: r.name,
        score: r.score,
        penalty: r.penalty,
        netScore: r.netScore,
        finalStageElapsed: r.finalStageElapsed,
      })),
    });
    return snap;
  });

  return { snapshotId: snapshot.id, createdAt: snapshot.createdAt.toISOString(), teams: ranked.length };
}

export async function generateOfficialCsv(): Promise<string> {
  // After a contest reset the previous run's snapshot still exists but must not be served as current
  const contest = await getContest();
  if (!contest.resultsFinalizedAt) throw notFound('No finalized results; call /api/admin/results/finalize first');

  const snap = await prisma.officialResultSnapshot.findFirst({
    where: { contestId: 1 },
    orderBy: { createdAt: 'desc' },
    include: { rows: { orderBy: { rank: 'asc' } } },
  });
  if (!snap) throw notFound('No finalized results; call /api/admin/results/finalize first');

  return toCsv(
    ['rank', 'team_id', 'team_name', 'score', 'penalty', 'net_score', 'final_stage_elapsed_seconds'],
    snap.rows.map((r) => [r.rank, r.teamId, r.teamName, r.score, r.penalty, r.netScore, r.finalStageElapsed]),
  );
}

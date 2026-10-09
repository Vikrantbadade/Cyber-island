import type { Contest, ContestStatus, Prisma } from '@prisma/client';
import { HttpError, conflict, gone, unprocessable } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { getNow, getRemainingSeconds, isMutationAllowed } from '../utils/time';
import { resetAttemptThrottle } from './answer-throttle';

type Db = Prisma.TransactionClient | typeof prisma;

const CONTEST_ID = 1;
const STAGE_COLUMNS = 12; // the table still has stage_7..12 columns (always NULL)

/** Load the singleton contest row; lazily persists RUNNING -> ENDED once deadline + grace has passed. */
export async function getContest(db: Db = prisma): Promise<Contest> {
  let c = await db.contest.findUnique({ where: { id: CONTEST_ID } });
  if (!c) {
    throw new HttpError(503, 'Game data is not initialized. Open /admin and run "Initialize game data".', 'CONTEST_MISSING');
  }

  const now = getNow();
  if (c.status === 'RUNNING' && c.endAt && now.getTime() > c.endAt.getTime() + c.graceSeconds * 1000) {
    await db.contest.updateMany({ where: { id: CONTEST_ID, status: 'RUNNING' }, data: { status: 'ENDED' } });
    c = { ...c, status: 'ENDED' };
  }
  return c;
}

export interface ContestStatusView {
  status: ContestStatus;
  startAt: string | null;
  endAt: string | null;
  durationMinutes: number;
  timezone: string;
  remainingSeconds: number;
  serverNow: string;
  resultsFinalized: boolean;
}

export async function getStatus(): Promise<ContestStatusView> {
  const c = await getContest();
  const now = getNow();
  // Between end_at and end_at+grace we already report ENDED (grace is hidden from clients).
  const effective: ContestStatus =
    c.status === 'RUNNING' && c.endAt && now.getTime() > c.endAt.getTime() ? 'ENDED' : c.status;
  return {
    status: effective,
    startAt: c.startAt?.toISOString() ?? null,
    endAt: c.endAt?.toISOString() ?? null,
    durationMinutes: c.durationMinutes,
    timezone: c.timezone,
    remainingSeconds: getRemainingSeconds(c, now),
    serverNow: now.toISOString(),
    resultsFinalized: c.resultsFinalizedAt !== null,
  };
}

/** Throws unless a game-state mutation is currently allowed. Returns the contest (with startAt set). */
export function assertMutationAllowed(c: Contest): Contest & { startAt: Date; endAt: Date } {
  if (c.status === 'NOT_STARTED') throw conflict('Contest has not started');
  if (!isMutationAllowed(c) || !c.startAt || !c.endAt) throw gone('Contest has ended');
  return c as Contest & { startAt: Date; endAt: Date };
}

export async function startContest(): Promise<ContestStatusView> {
  const c = await getContest();
  if (c.status !== 'NOT_STARTED') throw conflict('Contest already started');
  const now = getNow();
  const endAt = new Date(now.getTime() + c.durationMinutes * 60_000);
  const { count } = await prisma.contest.updateMany({
    where: { id: CONTEST_ID, status: 'NOT_STARTED' },
    data: { status: 'RUNNING', startAt: now, endAt },
  });
  if (count === 0) throw conflict('Contest already started');
  return getStatus();
}

export async function endContest(): Promise<ContestStatusView> {
  const c = await getContest();
  if (c.status === 'NOT_STARTED') throw conflict('Contest has not started');
  if (c.status === 'ENDED') throw conflict('Contest already ended');
  const now = getNow();
  await prisma.contest.updateMany({
    where: { id: CONTEST_ID, status: 'RUNNING' },
    data: { status: 'ENDED', endAt: c.endAt && c.endAt < now ? c.endAt : now },
  });
  return getStatus();
}

/** Shared by extend/set-deadline. Reopens an ENDED contest (if results are not finalized). */
async function applyNewDeadline(endAt: Date): Promise<ContestStatusView> {
  const now = getNow();
  if (endAt.getTime() <= now.getTime()) throw unprocessable('New deadline must be in the future');
  await prisma.contest.update({ where: { id: CONTEST_ID }, data: { status: 'RUNNING', endAt } });
  return getStatus();
}

function assertAdjustable(c: Contest) {
  if (c.status === 'NOT_STARTED') throw conflict('Contest has not started');
  if (c.resultsFinalizedAt) throw conflict('Results already finalized; contest cannot be changed');
}

export async function extendByDuration(additionalMinutes: number): Promise<ContestStatusView> {
  const c = await getContest();
  assertAdjustable(c);
  const now = getNow();
  // Running contest: add to the current deadline. Ended contest: reopen from now.
  const base = c.status === 'RUNNING' && c.endAt && c.endAt > now ? c.endAt : now;
  return applyNewDeadline(new Date(base.getTime() + additionalMinutes * 60_000));
}

/**
 * Host the contest again: ENDED + finalized -> NOT_STARTED, wiping per-team run data.
 * Teams (logins, names, passwords) and previously finalized official snapshots are kept.
 * All team sessions are deleted so every device has to log in again and reload fresh progress.
 */
export async function resetContest(opts: { durationMinutes?: number } = {}): Promise<ContestStatusView> {
  const c = await getContest();
  if (c.status === 'NOT_STARTED') throw conflict('Contest has not started; nothing to reset');
  if (c.status === 'RUNNING') throw conflict('End the contest before resetting it');
  if (!c.resultsFinalizedAt) throw conflict('Finalize the official results first so this run is archived');

  await prisma.$transaction(async (tx) => {
    // Claim the reset: only one caller wins, and only while still ENDED + finalized
    const { count } = await tx.contest.updateMany({
      where: { id: CONTEST_ID, status: 'ENDED', resultsFinalizedAt: { not: null } },
      data: {
        status: 'NOT_STARTED',
        startAt: null,
        endAt: null,
        resultsFinalizedAt: null,
        ...(opts.durationMinutes ? { durationMinutes: opts.durationMinutes } : {}),
      },
    });
    if (count === 0) throw conflict('Contest state changed; reload and try again');

    await tx.teamProgress.updateMany({
      data: Object.fromEntries(
        Array.from({ length: STAGE_COLUMNS }, (_, i) => [`stage${i + 1}CompletedElapsed`, null]),
      ) as Prisma.TeamProgressUpdateManyMutationInput,
    });
    await tx.teamHintProgress.updateMany({ data: { hintsUsedCount: 0 } });
    await tx.team.updateMany({ data: { score: 0, penalty: 0 } });
    await tx.teamSession.deleteMany();
  });

  resetAttemptThrottle(); // in-memory wrong-answer counters
  return getStatus();
}

export async function setDeadline(endAt: Date): Promise<ContestStatusView> {
  const c = await getContest();
  assertAdjustable(c);
  if (c.startAt && endAt.getTime() <= c.startAt.getTime()) {
    throw unprocessable('Deadline must be after contest start');
  }
  return applyNewDeadline(endAt);
}

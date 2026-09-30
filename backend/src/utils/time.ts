import type { Contest } from '@prisma/client';

type ContestTiming = Pick<Contest, 'status' | 'startAt' | 'endAt' | 'graceSeconds'>;

/** Server process clock — the only clock used for game logic. */
export const getNow = (): Date => new Date();

export function getContestElapsedSeconds(startAt: Date, now: Date = getNow()): number {
  return Math.max(0, Math.floor((now.getTime() - startAt.getTime()) / 1000));
}

export const getContestDeadline = (c: Pick<Contest, 'endAt'>): Date | null => c.endAt;

/** Mutation accepted only while RUNNING and now <= end_at + grace (hidden from clients). */
export function isMutationAllowed(c: ContestTiming, now: Date = getNow()): boolean {
  if (c.status !== 'RUNNING' || !c.startAt || !c.endAt) return false;
  return now.getTime() <= c.endAt.getTime() + c.graceSeconds * 1000;
}

/** Remaining seconds to the visible deadline (grace is not exposed). */
export function getRemainingSeconds(c: ContestTiming, now: Date = getNow()): number {
  if (c.status !== 'RUNNING' || !c.endAt) return 0;
  return Math.max(0, Math.floor((c.endAt.getTime() - now.getTime()) / 1000));
}

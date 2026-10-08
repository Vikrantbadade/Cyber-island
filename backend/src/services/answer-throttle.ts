import { tooManyRequests } from '../lib/errors';

/**
 * Brute-force guard for answer submissions: a team may submit at most MAX_WRONG wrong answers per WINDOW_MS.
 * In memory (the backend is a single process); a restart simply forgives everyone, which is fine.
 */
const WINDOW_MS = 60_000;
const MAX_WRONG = 10;

const wrongByTeam = new Map<string, number[]>();

function recent(teamId: string, now: number): number[] {
  const list = (wrongByTeam.get(teamId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length === 0) wrongByTeam.delete(teamId);
  else wrongByTeam.set(teamId, list);
  return list;
}

export function assertAttemptAllowed(teamId: string, now = Date.now()) {
  const list = recent(teamId, now);
  if (list.length >= MAX_WRONG) {
    const waitSeconds = Math.max(1, Math.ceil((list[0] + WINDOW_MS - now) / 1000));
    throw tooManyRequests(`Too many wrong answers. Try again in ${waitSeconds}s.`);
  }
}

export function recordWrongAttempt(teamId: string, now = Date.now()) {
  const list = recent(teamId, now);
  list.push(now);
  wrongByTeam.set(teamId, list);
}

export function clearAttempts(teamId: string) {
  wrongByTeam.delete(teamId);
}

/** Test helper. */
export function resetAttemptThrottle() {
  wrongByTeam.clear();
}

export const ANSWER_THROTTLE = { WINDOW_MS, MAX_WRONG } as const;

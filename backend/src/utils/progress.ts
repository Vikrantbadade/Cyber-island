import type { TeamProgress } from '@prisma/client';

export const TOTAL_STAGES = 12;

/** Column name for a stage on TeamProgress, e.g. 3 -> "stage3CompletedElapsed". */
export const stageField = (stageId: number) =>
  `stage${stageId}CompletedElapsed` as keyof TeamProgress;

/** Elapsed seconds per stage (index 0 = stage 1); null = not completed. */
export function elapsedArray(p: TeamProgress | null): (number | null)[] {
  return Array.from({ length: TOTAL_STAGES }, (_, i) =>
    p ? ((p[stageField(i + 1)] as number | null) ?? null) : null,
  );
}

/** Highest completed stage (0 if none). */
export function completedStageCount(p: TeamProgress | null): number {
  const arr = elapsedArray(p);
  for (let i = TOTAL_STAGES - 1; i >= 0; i--) if (arr[i] !== null) return i + 1;
  return 0;
}

/** Next stage to complete, or null when all 12 are done. */
export function nextStageOf(p: TeamProgress | null): number | null {
  const n = completedStageCount(p);
  return n >= TOTAL_STAGES ? null : n + 1;
}

export const finalStageElapsed = (p: TeamProgress | null): number | null =>
  p?.stage12CompletedElapsed ?? null;

/** Ranking comparator: net desc, then final-stage elapsed asc (incomplete last). */
export function compareRank(
  a: { netScore: number; finalStageElapsed: number | null },
  b: { netScore: number; finalStageElapsed: number | null },
): number {
  if (b.netScore !== a.netScore) return b.netScore - a.netScore;
  const ae = a.finalStageElapsed ?? Number.POSITIVE_INFINITY;
  const be = b.finalStageElapsed ?? Number.POSITIVE_INFINITY;
  if (ae === be) return 0;
  return ae < be ? -1 : 1;
}

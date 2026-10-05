import { Prisma } from '@prisma/client';
import type { Team, TeamHintProgress, TeamProgress, TeamSession } from '@prisma/client';
import { conflict, notFound, unprocessable } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  TOTAL_STAGES,
  compareRank,
  completedStageCount,
  elapsedArray,
  finalStageElapsed,
  nextStageOf,
} from '../utils/progress';
import { getContestElapsedSeconds, getNow } from '../utils/time';
import { getContest } from './contest.service';
import { ensureTeamRows } from './team-integrity.service';
import { applyStageCompletion, parseStageId } from './team-progress.service';

type TeamFull = Team & {
  progress: TeamProgress | null;
  hintProgress: TeamHintProgress[];
  session: TeamSession | null;
};

const include = { progress: true, hintProgress: true, session: true } as const;

function summarize(t: TeamFull) {
  const completed = completedStageCount(t.progress);
  return {
    id: t.id,
    name: t.name,
    loginName: t.loginName,
    completedStages: completed,
    nextStage: nextStageOf(t.progress),
    status: completed === TOTAL_STAGES ? 'FINISHED' : completed === 0 ? 'NOT_STARTED' : 'IN_PROGRESS',
    score: t.score,
    penalty: t.penalty,
    netScore: t.score - t.penalty,
    finalStageElapsed: finalStageElapsed(t.progress),
    sessionActive: !!t.session && t.session.expiresAt.getTime() > Date.now(),
  };
}

export interface ListTeamsQuery {
  q?: string;
  completedStages?: number;
  sortBy: 'name' | 'completedStages' | 'score' | 'penalty';
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export async function listTeams(query: ListTeamsQuery) {
  const teams = (await prisma.team.findMany({ include })) as TeamFull[];
  let rows = teams.map(summarize);

  if (query.q) {
    const needle = query.q.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(needle));
  }
  if (query.completedStages !== undefined) {
    rows = rows.filter((r) => r.completedStages === query.completedStages);
  }

  const dir = query.order === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    const av = a[query.sortBy];
    const bv = b[query.sortBy];
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return cmp * dir || a.name.localeCompare(b.name);
  });

  const total = rows.length;
  const start = (query.page - 1) * query.pageSize;
  return { total, page: query.page, pageSize: query.pageSize, teams: rows.slice(start, start + query.pageSize) };
}

export async function getTeamDetails(teamId: string) {
  const t = (await prisma.team.findUnique({ where: { id: teamId }, include })) as TeamFull | null;
  if (!t) throw notFound('Team not found');
  const elapsed = elapsedArray(t.progress);
  const used = new Map(t.hintProgress.map((h) => [h.stageId, h.hintsUsedCount]));
  return {
    ...summarize(t),
    stages: elapsed.map((e, i) => ({
      stageId: i + 1,
      completedElapsedSeconds: e,
      hintsUsed: used.get(i + 1) ?? 0,
    })),
  };
}

export interface NewTeamInput {
  name: string;
  loginName: string;
  password: string;
}

/** Create a team together with its progress + per-stage hint rows (one transaction), ready to play at once. */
export async function createTeam(input: NewTeamInput) {
  try {
    const id = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: { name: input.name, loginName: input.loginName, passwordPlaintext: input.password },
        select: { id: true },
      });
      // Not a nested create: the DB trigger may already have inserted these rows; this is conflict-safe.
      await ensureTeamRows(tx, team.id);
      return team.id;
    });
    return await getTeamDetails(id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw conflict(`Login ID "${input.loginName}" is already in use`);
    }
    throw e;
  }
}

/**
 * Delete a team. Its session, progress and hint rows go with it (ON DELETE CASCADE), and any token it holds
 * stops working immediately because teamAuth looks the session up on every request.
 * Already-finalized official result snapshots keep their copy of the row (they hold no foreign key to teams).
 */
export async function deleteTeam(teamId: string) {
  try {
    const team = await prisma.team.delete({
      where: { id: teamId },
      select: { id: true, name: true, loginName: true },
    });
    return { deleted: true as const, ...team };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') throw notFound('Team not found');
    throw e;
  }
}

/** Admin override: still strictly sequential; timestamp = server time of the admin action. */
export async function manuallyCompleteNextStage(teamId: string, rawStageId: unknown) {
  const stageId = parseStageId(rawStageId);
  await prisma.$transaction(async (tx) => {
    const exists = await tx.team.findUnique({ where: { id: teamId }, select: { id: true } });
    if (!exists) throw notFound('Team not found');
    const contest = await getContest(tx);
    if (!contest.startAt) throw conflict('Contest has not started');
    await applyStageCompletion(tx, teamId, stageId, getContestElapsedSeconds(contest.startAt, getNow()));
  });
  return getTeamDetails(teamId);
}

async function setField(teamId: string, field: 'score' | 'penalty', value: number) {
  if (!Number.isInteger(value) || value < 0) throw unprocessable(`${field} must be a non-negative integer`);
  const { count } = await prisma.team.updateMany({ where: { id: teamId }, data: { [field]: value } });
  if (count === 0) throw notFound('Team not found');
  return getTeamDetails(teamId);
}

export const setScore = (teamId: string, score: number) => setField(teamId, 'score', score);
export const setPenalty = (teamId: string, penalty: number) => setField(teamId, 'penalty', penalty);

/** Ranked live leaderboard (net desc, final-stage elapsed asc). Also used by results finalization. */
export async function rankTeams() {
  const teams = (await prisma.team.findMany({ include })) as TeamFull[];
  const rows = teams.map(summarize).sort((a, b) => compareRank(a, b) || a.name.localeCompare(b.name));
  return rows.map((r, i) => ({ rank: i + 1, ...r }));
}

export async function getLeaderboard(page: number, pageSize: number) {
  const ranked = await rankTeams();
  const start = (page - 1) * pageSize;
  return { total: ranked.length, page, pageSize, entries: ranked.slice(start, start + pageSize) };
}

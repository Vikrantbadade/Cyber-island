import { Request, Response } from 'express';
import { z } from 'zod';
import * as adminTeams from '../services/admin-team.service';
import * as contest from '../services/contest.service';

const listSchema = z.object({
  q: z.string().trim().min(1).optional(),
  completedStages: z.coerce.number().int().min(0).max(12).optional(),
  sortBy: z.enum(['name', 'completedStages', 'score', 'penalty']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
});

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200),
});

const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(80),
  loginName: z.string().trim().min(1).max(40).regex(/^\S+$/, 'Login ID must not contain spaces'),
  password: z.string().min(1).max(100), // not trimmed: team login compares it exactly
});

const teamId = (req: Request) => z.string().uuid().parse(req.params.teamId);

// ---- teams ----
export async function listTeams(req: Request, res: Response) {
  res.json(await adminTeams.listTeams(listSchema.parse(req.query)));
}
export async function getTeam(req: Request, res: Response) {
  res.json(await adminTeams.getTeamDetails(teamId(req)));
}
export async function createTeam(req: Request, res: Response) {
  res.status(201).json(await adminTeams.createTeam(createTeamSchema.parse(req.body)));
}
export async function deleteTeam(req: Request, res: Response) {
  res.json(await adminTeams.deleteTeam(teamId(req)));
}
export async function completeStage(req: Request, res: Response) {
  res.json(await adminTeams.manuallyCompleteNextStage(teamId(req), req.params.stageId));
}
export async function setScore(req: Request, res: Response) {
  const { score } = z.object({ score: z.number() }).parse(req.body);
  res.json(await adminTeams.setScore(teamId(req), score));
}
export async function setPenalty(req: Request, res: Response) {
  const { penalty } = z.object({ penalty: z.number() }).parse(req.body);
  res.json(await adminTeams.setPenalty(teamId(req), penalty));
}
export async function leaderboard(req: Request, res: Response) {
  const { page, pageSize } = pageSchema.parse(req.query);
  res.json(await adminTeams.getLeaderboard(page, pageSize));
}

// ---- contest control ----
export async function startContest(_req: Request, res: Response) {
  res.json(await contest.startContest());
}
export async function endContest(_req: Request, res: Response) {
  res.json(await contest.endContest());
}
export async function extendDuration(req: Request, res: Response) {
  const { additionalMinutes } = z.object({ additionalMinutes: z.number().int().positive() }).parse(req.body);
  res.json(await contest.extendByDuration(additionalMinutes));
}
export async function setDeadline(req: Request, res: Response) {
  const { endAt } = z.object({ endAt: z.string().datetime({ offset: true }) }).parse(req.body);
  res.json(await contest.setDeadline(new Date(endAt)));
}

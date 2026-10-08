import { Response } from 'express';
import { z } from 'zod';
import { TeamRequest } from '../types/auth.types';
import * as svc from '../services/team-progress.service';

const answerSchema = z.object({ answer: z.string().trim().min(1).max(200) });

export async function me(req: TeamRequest, res: Response) {
  res.json(await svc.getTeamProfile(req.team!.id));
}

export async function progress(req: TeamRequest, res: Response) {
  res.json(await svc.getTeamProgress(req.team!.id));
}

export async function submitAnswer(req: TeamRequest, res: Response) {
  const { answer } = answerSchema.parse(req.body);
  res.json(await svc.submitAnswer(req.team!.id, req.params.stageId, answer));
}

export async function useHint(req: TeamRequest, res: Response) {
  res.json(await svc.useNextHint(req.team!.id, req.params.stageId));
}

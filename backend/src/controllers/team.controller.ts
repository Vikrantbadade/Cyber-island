import { Response } from 'express';
import { TeamRequest } from '../types/auth.types';
import * as svc from '../services/team-progress.service';

export async function me(req: TeamRequest, res: Response) {
  res.json(await svc.getTeamProfile(req.team!.id));
}

export async function progress(req: TeamRequest, res: Response) {
  res.json(await svc.getTeamProgress(req.team!.id));
}

export async function completeStage(req: TeamRequest, res: Response) {
  res.json(await svc.completeNextStage(req.team!.id, req.params.stageId));
}

export async function useHint(req: TeamRequest, res: Response) {
  res.json(await svc.useNextHint(req.team!.id, req.params.stageId));
}

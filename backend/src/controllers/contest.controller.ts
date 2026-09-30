import { Request, Response } from 'express';
import * as contestService from '../services/contest.service';

export async function getContestStatus(_req: Request, res: Response) {
  res.json(await contestService.getStatus());
}

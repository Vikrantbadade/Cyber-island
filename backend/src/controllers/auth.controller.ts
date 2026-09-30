import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';

const loginSchema = z.object({ loginName: z.string().min(1), password: z.string().min(1) });
const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export async function teamLogin(req: Request, res: Response) {
  const { loginName, password } = loginSchema.parse(req.body);
  res.status(201).json(await authService.loginTeam(loginName, password));
}

export async function teamRefresh(req: Request, res: Response) {
  const { refreshToken } = refreshSchema.parse(req.body);
  res.json(await authService.refreshTeamAccessToken(refreshToken));
}

export async function adminLogin(req: Request, res: Response) {
  const { loginName, password } = loginSchema.parse(req.body);
  res.status(201).json(authService.loginAdmin(loginName, password));
}

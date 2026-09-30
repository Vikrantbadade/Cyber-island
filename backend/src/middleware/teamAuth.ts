import { NextFunction, Response } from 'express';
import { asyncHandler, unauthorized } from '../lib/errors';
import { verifyTeamAccess } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { TeamRequest } from '../types/auth.types';

function bearer(header?: string): string {
  if (!header?.startsWith('Bearer ')) throw unauthorized('Missing bearer token');
  return header.slice(7).trim();
}

/** Requires a valid access JWT whose session id matches the team's current session row. */
export const teamAuth = asyncHandler(async (req: TeamRequest, _res: Response, next: NextFunction) => {
  const payload = verifyTeamAccess(bearer(req.headers.authorization));

  const session = await prisma.teamSession.findUnique({ where: { teamId: payload.sub } });
  if (!session || session.id !== payload.sid || session.expiresAt.getTime() <= Date.now()) {
    throw unauthorized('Session is no longer active');
  }

  req.team = { id: payload.sub, sessionId: payload.sid };
  next();
});

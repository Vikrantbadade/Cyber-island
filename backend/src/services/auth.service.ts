import { randomUUID } from 'node:crypto';
import { env } from '../config/env';
import { unauthorized } from '../lib/errors';
import { signAdminAccess, signTeamAccess, signTeamRefresh, verifyTeamRefresh } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { ensureTeamRows } from './team-integrity.service';

/** "30m" | "6h" | "2d" | "45s" | plain seconds -> milliseconds */
export function parseDurationMs(v: string): number {
  const m = /^(\d+)\s*([smhd]?)$/.exec(v.trim());
  if (!m) throw new Error(`Invalid duration: ${v}`);
  const n = Number(m[1]);
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, '': 1000 }[m[2] as 's' | 'm' | 'h' | 'd' | ''];
  return n * mult;
}

export async function loginTeam(loginName: string, password: string) {
  const team = await prisma.team.findUnique({ where: { loginName } });
  if (!team || team.passwordPlaintext !== password) throw unauthorized('Invalid credentials');

  // Teams added by hand in the DB may lack progress rows; create them so the team can actually play
  await ensureTeamRows(prisma, team.id);

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));

  // team_sessions.team_id is unique -> upsert replaces any existing session, invalidating old tokens
  await prisma.teamSession.upsert({
    where: { teamId: team.id },
    update: { id: sessionId, createdAt: new Date(), expiresAt },
    create: { id: sessionId, teamId: team.id, expiresAt },
  });

  return {
    accessToken: signTeamAccess(team.id, sessionId),
    refreshToken: signTeamRefresh(team.id, sessionId),
  };
}

export async function refreshTeamAccessToken(refreshToken: string) {
  const payload = verifyTeamRefresh(refreshToken);
  const session = await prisma.teamSession.findUnique({ where: { teamId: payload.sub } });
  if (!session || session.id !== payload.sid || session.expiresAt.getTime() <= Date.now()) {
    throw unauthorized('Session is no longer active');
  }
  return { accessToken: signTeamAccess(payload.sub, payload.sid) };
}

export function loginAdmin(loginName: string, password: string) {
  if (loginName !== env.ADMIN_LOGIN_NAME || password !== env.ADMIN_PASSWORD) {
    throw unauthorized('Invalid credentials');
  }
  return { accessToken: signAdminAccess() };
}

import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';
import { unauthorized } from '../lib/errors';
import { signAdminAccess, signTeamAccess, signTeamRefresh, verifyTeamRefresh } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import type { AdminTokenPayload } from '../types/auth.types';
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

/** Constant-time string comparison (hashes first so the lengths always match). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Admin login. There is exactly one admin session: logging in replaces it, so any other admin tab/device is
 * signed out on its next request (same rule as team logins).
 */
export async function loginAdmin(loginName: string, password: string) {
  const nameOk = safeEqual(loginName, env.ADMIN_LOGIN_NAME);
  const passwordOk = safeEqual(password, env.ADMIN_PASSWORD);
  if (!nameOk || !passwordOk) throw unauthorized('Invalid credentials');

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));
  await prisma.adminSession.upsert({
    where: { id: 1 },
    update: { sessionId, createdAt: new Date(), expiresAt },
    create: { id: 1, sessionId, expiresAt },
  });
  return { accessToken: signAdminAccess(sessionId) };
}

/** The admin JWT is only valid while its session id is the current admin_session row. */
export async function assertAdminSession(payload: AdminTokenPayload) {
  const session = await prisma.adminSession.findUnique({ where: { id: 1 } });
  if (
    !payload.sid ||
    !session ||
    session.sessionId !== payload.sid ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    throw unauthorized('Session is no longer active');
  }
}

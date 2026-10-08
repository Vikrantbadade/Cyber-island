import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AdminTokenPayload, TeamTokenPayload } from '../types/auth.types';
import { forbidden, unauthorized } from './errors';

type ExpiresIn = SignOptions['expiresIn'];

export function signTeamAccess(teamId: string, sessionId: string): string {
  const payload: TeamTokenPayload = { sub: teamId, sid: sessionId, role: 'team', typ: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as ExpiresIn,
  });
}

export function signTeamRefresh(teamId: string, sessionId: string): string {
  const payload: TeamTokenPayload = { sub: teamId, sid: sessionId, role: 'team', typ: 'refresh' };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as ExpiresIn,
  });
}

export function signAdminAccess(sessionId: string): string {
  const payload: AdminTokenPayload = { sub: 'admin', sid: sessionId, role: 'admin', typ: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as ExpiresIn,
  });
}

function verify<T>(token: string, secret: string): T {
  try {
    return jwt.verify(token, secret) as T;
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

export function verifyTeamAccess(token: string): TeamTokenPayload {
  const p = verify<TeamTokenPayload>(token, env.JWT_ACCESS_SECRET);
  if (p.role !== 'team' || p.typ !== 'access') throw unauthorized('Invalid token type');
  return p;
}

export function verifyTeamRefresh(token: string): TeamTokenPayload {
  const p = verify<TeamTokenPayload>(token, env.JWT_REFRESH_SECRET);
  if (p.role !== 'team' || p.typ !== 'refresh') throw unauthorized('Invalid token type');
  return p;
}

export function verifyAdminAccess(token: string): AdminTokenPayload {
  const p = verify<AdminTokenPayload>(token, env.JWT_ACCESS_SECRET);
  if (p.role !== 'admin') throw forbidden('Admin role required');
  return p;
}

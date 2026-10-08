import type { Request } from 'express';

export interface TeamTokenPayload {
  sub: string; // team id
  sid: string; // session id
  role: 'team';
  typ: 'access' | 'refresh';
}

export interface AdminTokenPayload {
  sub: 'admin';
  sid: string; // admin session id (must match the admin_session row)
  role: 'admin';
  typ: 'access';
}

export interface TeamRequest extends Request {
  team?: { id: string; sessionId: string };
}

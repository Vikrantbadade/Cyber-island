import { NextFunction, Request, Response } from 'express';
import { unauthorized } from '../lib/errors';
import { verifyAdminAccess } from '../lib/jwt';

export function adminAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) throw unauthorized('Missing bearer token');
    verifyAdminAccess(h.slice(7).trim());
    next();
  } catch (e) {
    next(e);
  }
}

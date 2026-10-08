import { asyncHandler, unauthorized } from '../lib/errors';
import { verifyAdminAccess } from '../lib/jwt';
import { assertAdminSession } from '../services/auth.service';

/** Requires a valid admin JWT whose session id is the CURRENT admin session (only one admin login at a time). */
export const adminAuth = asyncHandler(async (req, _res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) throw unauthorized('Missing bearer token');
  const payload = verifyAdminAccess(h.slice(7).trim());
  await assertAdminSession(payload);
  next();
});

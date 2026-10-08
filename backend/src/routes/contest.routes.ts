import { Router } from 'express';
import { getContestStatus } from '../controllers/contest.controller';
import { HttpError, asyncHandler, unauthorized } from '../lib/errors';
import { verifyAdminAccess } from '../lib/jwt';
import { teamAuth } from '../middleware/teamAuth';
import { assertAdminSession } from '../services/auth.service';

const router = Router();

/** Status is readable by both the team frontend and the admin page. */
const teamOrAdmin = asyncHandler(async (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) throw unauthorized('Missing bearer token');

  let isAdmin = false;
  try {
    const payload = verifyAdminAccess(h.slice(7).trim());
    await assertAdminSession(payload); // 401 for an admin token that was signed out by a newer admin login
    isAdmin = true;
  } catch (e) {
    // 403 = valid token but not admin -> fall through to team auth
    if (!(e instanceof HttpError && e.status === 403)) throw e;
  }
  if (isAdmin) return next();
  return teamAuth(req, res, next);
});

router.get('/status', teamOrAdmin, asyncHandler(async (req, res) => getContestStatus(req, res)));

export default router;

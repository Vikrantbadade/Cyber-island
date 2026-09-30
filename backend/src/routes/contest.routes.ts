import { NextFunction, Request, Response, Router } from 'express';
import { getContestStatus } from '../controllers/contest.controller';
import { HttpError, asyncHandler, unauthorized } from '../lib/errors';
import { verifyAdminAccess } from '../lib/jwt';
import { teamAuth } from '../middleware/teamAuth';

const router = Router();

/** Status is readable by both the team frontend and the admin page. */
function teamOrAdmin(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return next(unauthorized('Missing bearer token'));
  try {
    verifyAdminAccess(h.slice(7).trim());
    return next();
  } catch (e) {
    // 403 = valid token but not admin -> fall through to team auth
    if (e instanceof HttpError && e.status === 403) return teamAuth(req, res, next);
    return next(e);
  }
}

router.get('/status', teamOrAdmin, asyncHandler(async (req, res) => getContestStatus(req, res)));

export default router;

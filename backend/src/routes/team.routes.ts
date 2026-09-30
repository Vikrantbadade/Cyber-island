import { Router } from 'express';
import { completeStage, me, progress, useHint } from '../controllers/team.controller';
import { asyncHandler } from '../lib/errors';
import { teamAuth } from '../middleware/teamAuth';

const router = Router();

router.use(teamAuth);
router.get('/me', asyncHandler(async (req, res) => me(req, res)));
router.get('/progress', asyncHandler(async (req, res) => progress(req, res)));
router.post('/stages/:stageId/complete', asyncHandler(async (req, res) => completeStage(req, res)));
router.post('/stages/:stageId/hint', asyncHandler(async (req, res) => useHint(req, res)));

export default router;

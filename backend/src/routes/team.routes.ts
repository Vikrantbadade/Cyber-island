import { Router } from 'express';
import { me, progress, submitAnswer, useHint } from '../controllers/team.controller';
import { asyncHandler } from '../lib/errors';
import { teamAuth } from '../middleware/teamAuth';

const router = Router();

router.use(teamAuth);
router.get('/me', asyncHandler(async (req, res) => me(req, res)));
router.get('/progress', asyncHandler(async (req, res) => progress(req, res)));
// Teams cannot mark a stage complete themselves: they submit an answer and the server verifies it.
// (Admins can still force a completion via POST /api/admin/teams/:id/stages/:stageId/complete.)
router.post('/stages/:stageId/submit', asyncHandler(async (req, res) => submitAnswer(req, res)));
router.post('/stages/:stageId/hint', asyncHandler(async (req, res) => useHint(req, res)));

export default router;

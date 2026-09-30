import { Router } from 'express';
import { teamLogin, teamRefresh } from '../controllers/auth.controller';
import { asyncHandler } from '../lib/errors';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => teamLogin(req, res)));
router.post('/refresh', asyncHandler(async (req, res) => teamRefresh(req, res)));

export default router;

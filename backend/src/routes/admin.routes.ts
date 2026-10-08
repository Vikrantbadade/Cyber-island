import { Router } from 'express';
import * as admin from '../controllers/admin.controller';
import { adminLogin } from '../controllers/auth.controller';
import * as results from '../controllers/results.controller';
import { asyncHandler } from '../lib/errors';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();
const h = (fn: (req: any, res: any) => Promise<unknown>) => asyncHandler(async (req, res) => { await fn(req, res); });

// Public
router.post('/auth/login', h(adminLogin));

// Everything below requires an admin JWT
router.use(adminAuth);

// Setup (manual seeding; nothing is seeded automatically at container start)
router.get('/setup/status', h(admin.setupStatus));
router.post('/setup/initialize', h(admin.initializeGameData));
router.post('/setup/teams', h(admin.importTeams));

// Contest control
router.post('/contest/start', h(admin.startContest));
router.post('/contest/end', h(admin.endContest));
router.post('/contest/extend-duration', h(admin.extendDuration));
router.post('/contest/set-deadline', h(admin.setDeadline));

// Results
router.post('/results/finalize', h(results.finalize));
router.get('/results/csv', h(results.csv));

// Teams
router.get('/teams', h(admin.listTeams));
router.post('/teams', h(admin.createTeam));
router.get('/teams/:teamId', h(admin.getTeam));
router.delete('/teams/:teamId', h(admin.deleteTeam));
router.post('/teams/:teamId/stages/:stageId/complete', h(admin.completeStage));
router.patch('/teams/:teamId/score', h(admin.setScore));
router.patch('/teams/:teamId/penalty', h(admin.setPenalty));
router.get('/leaderboard', h(admin.leaderboard));

export default router;

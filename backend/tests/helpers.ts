import request from 'supertest';
import { SAMPLE_TEAMS } from '../prisma/seed-data';
import { app } from '../src/app';
import { STAGES } from '../src/config/stages';
import { prisma } from '../src/lib/prisma';
import { resetAttemptThrottle } from '../src/services/answer-throttle';
import { importTeams } from '../src/services/seed.service';
import { TOTAL_STAGES } from '../src/utils/progress';

/**
 * Integration tests run against the REAL database in DATABASE_URL (run `pnpm prisma db push` and `pnpm seed` first).
 * reset() makes sure the sample teams alpha/bravo/charlie exist with their sample passwords, whatever `pnpm seed`
 * loaded from prisma/teams.json. DO NOT point this at event data: reset() wipes all progress and overwrites
 * the passwords of teams with those login IDs.
 */
export const api = () => request(app);

export async function reset() {
  resetAttemptThrottle();
  await importTeams(SAMPLE_TEAMS); // creates missing sample teams / restores their passwords, keeps nothing else
  await prisma.officialResultRow.deleteMany();
  await prisma.officialResultSnapshot.deleteMany();
  await prisma.teamSession.deleteMany();
  await prisma.teamHintProgress.updateMany({ data: { hintsUsedCount: 0 } });
  await prisma.teamProgress.updateMany({
    // The table still has stage_7..12 columns (always NULL); clearing only the real stages is enough
    data: Object.fromEntries(Array.from({ length: TOTAL_STAGES }, (_, i) => [`stage${i + 1}CompletedElapsed`, null])),
  });
  await prisma.team.updateMany({ data: { score: 0, penalty: 0 } });
  await prisma.contest.update({
    where: { id: 1 },
    data: { status: 'NOT_STARTED', startAt: null, endAt: null, durationMinutes: 180, resultsFinalizedAt: null },
  });
}

export async function teamLogin(loginName = 'alpha', password = 'alpha123') {
  const res = await api().post('/api/auth/login').send({ loginName, password });
  return { res, token: res.body.accessToken as string, refresh: res.body.refreshToken as string };
}

export async function adminToken() {
  const res = await api()
    .post('/api/admin/auth/login')
    .send({ loginName: process.env.ADMIN_LOGIN_NAME, password: process.env.ADMIN_PASSWORD });
  return res.body.accessToken as string;
}

export const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

export async function startContest(admin: string) {
  return api().post('/api/admin/contest/start').set(bearer(admin));
}

/** First accepted answer for a stage, straight from the server config. */
export const answerFor = (stageId: number) => STAGES[stageId - 1].answers[0];

/** Submit an answer for a stage as a team (defaults to the correct one). */
export const submit = (token: string, stageId: number, answer: string = answerFor(stageId)) =>
  api().post(`/api/team/stages/${stageId}/submit`).set(bearer(token)).send({ answer });

export { prisma };

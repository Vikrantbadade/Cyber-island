import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

/**
 * Integration tests run against the REAL database in DATABASE_URL (run `pnpm seed` first,
 * sample teams alpha/bravo/charlie). DO NOT point this at event data: reset() wipes all progress.
 */
export const api = () => request(app);

export async function reset() {
  await prisma.officialResultRow.deleteMany();
  await prisma.officialResultSnapshot.deleteMany();
  await prisma.teamSession.deleteMany();
  await prisma.teamHintProgress.updateMany({ data: { hintsUsedCount: 0 } });
  await prisma.teamProgress.updateMany({
    data: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`stage${i + 1}CompletedElapsed`, null])),
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

export { prisma };

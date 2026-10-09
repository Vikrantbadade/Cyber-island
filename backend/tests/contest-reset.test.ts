import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { adminToken, answerFor, api, bearer, prisma, reset, startContest, submit, teamLogin } from './helpers';

const resetCall = (admin: string, body: object = { confirm: 'RESET' }) =>
  api().post('/api/admin/contest/reset').set(bearer(admin)).send(body);

/** Start, let alpha complete stage 1 and use a hint, end and finalize. Returns the tokens. */
async function playAndFinalize() {
  const admin = await adminToken();
  await startContest(admin);
  const { token } = await teamLogin('alpha', 'alpha123');
  expect((await submit(token, 1)).status).toBe(200);
  expect((await api().post('/api/team/stages/2/hint').set(bearer(token))).status).toBe(200);
  await api().post('/api/admin/contest/end').set(bearer(admin));
  expect((await api().post('/api/admin/results/finalize').set(bearer(admin))).status).toBe(200);
  return { admin, token };
}

describe('contest reset (host again)', () => {
  beforeEach(reset);
  afterAll(() => prisma.$disconnect());

  it('is refused unless the contest is ENDED and finalized, and needs confirm', async () => {
    const admin = await adminToken();
    expect((await resetCall(admin)).status).toBe(409); // NOT_STARTED

    await startContest(admin);
    expect((await resetCall(admin)).status).toBe(409); // RUNNING

    await api().post('/api/admin/contest/end').set(bearer(admin));
    expect((await resetCall(admin)).status).toBe(409); // ENDED but not finalized

    await api().post('/api/admin/results/finalize').set(bearer(admin));
    expect((await resetCall(admin, {})).status).toBe(400); // no confirm (validation error)
    expect((await resetCall(admin, { confirm: 'yes' })).status).toBe(400);
    expect((await api().post('/api/admin/contest/reset')).status).toBe(401); // no admin token
  });

  it('wipes the run, keeps teams and old snapshots, and logs teams out', async () => {
    const { admin, token } = await playAndFinalize();
    const teamsBefore = await prisma.team.count();
    const snapshotsBefore = await prisma.officialResultSnapshot.count();
    expect((await prisma.team.findUniqueOrThrow({ where: { loginName: 'alpha' } })).score).toBeGreaterThan(0);

    const res = await resetCall(admin);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('NOT_STARTED');
    expect(res.body.startAt).toBeNull();
    expect(res.body.endAt).toBeNull();
    expect(res.body.resultsFinalized).toBe(false);

    expect(await prisma.team.count()).toBe(teamsBefore);
    expect(await prisma.team.count({ where: { OR: [{ score: { not: 0 } }, { penalty: { not: 0 } }] } })).toBe(0);
    expect(await prisma.teamHintProgress.count({ where: { hintsUsedCount: { not: 0 } } })).toBe(0);
    expect(await prisma.teamProgress.count({ where: { stage1CompletedElapsed: { not: null } } })).toBe(0);
    expect(await prisma.teamSession.count()).toBe(0);
    expect(await prisma.officialResultSnapshot.count()).toBe(snapshotsBefore); // archived run is kept

    // The old team token no longer works
    expect((await api().get('/api/team/me').set(bearer(token))).status).toBe(401);
    // A second reset has nothing to do
    expect((await resetCall(admin)).status).toBe(409);
  });

  it('can be started again and played from scratch; old official CSV is not served', async () => {
    const { admin } = await playAndFinalize();
    await resetCall(admin);

    expect((await api().get('/api/admin/results/csv').set(bearer(admin))).status).toBe(404);

    expect((await startContest(admin)).status).toBe(200);
    const { token } = await teamLogin('alpha', 'alpha123');
    const progress = await api().get('/api/team/progress').set(bearer(token));
    expect(progress.body.completedStages).toEqual([]);
    expect(progress.body.nextStage).toBe(1);
    expect(progress.body.netScore).toBe(0);
    expect((await submit(token, 1, answerFor(1))).status).toBe(200);

    // Second run can be finalized again and produces its own CSV
    await api().post('/api/admin/contest/end').set(bearer(admin));
    expect((await api().post('/api/admin/results/finalize').set(bearer(admin))).status).toBe(200);
    expect((await api().get('/api/admin/results/csv').set(bearer(admin))).status).toBe(200);
  });

  it('can change the duration for the next run', async () => {
    const { admin } = await playAndFinalize();
    const res = await resetCall(admin, { confirm: 'RESET', durationMinutes: 45 });
    expect(res.status).toBe(200);
    expect(res.body.durationMinutes).toBe(45);
  });
});

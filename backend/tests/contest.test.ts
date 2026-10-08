import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { adminToken, api, bearer, prisma, reset, startContest, submit, teamLogin } from './helpers';

describe('contest lifecycle & timing', () => {
  beforeEach(reset);
  afterAll(() => prisma.$disconnect());

  it('starts NOT_STARTED and rejects mutations before start (409)', async () => {
    const { token } = await teamLogin();
    const s = await api().get('/api/contest/status').set(bearer(token));
    expect(s.body.status).toBe('NOT_STARTED');
    expect((await submit(token, 1)).status).toBe(409);
  });

  it('admin start sets RUNNING with start/end; second start is 409', async () => {
    const admin = await adminToken();
    const r = await startContest(admin);
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('RUNNING');
    expect(r.body.remainingSeconds).toBeGreaterThan(180 * 60 - 5);
    expect((await startContest(admin)).status).toBe(409);
  });

  it('extend-duration adds time', async () => {
    const admin = await adminToken();
    const before = (await startContest(admin)).body.remainingSeconds;
    const r = await api().post('/api/admin/contest/extend-duration').set(bearer(admin)).send({ additionalMinutes: 10 });
    expect(r.status).toBe(200);
    expect(r.body.remainingSeconds - before).toBeGreaterThanOrEqual(599);
  });

  it('set-deadline rejects past deadlines (422)', async () => {
    const admin = await adminToken();
    await startContest(admin);
    const r = await api()
      .post('/api/admin/contest/set-deadline')
      .set(bearer(admin))
      .send({ endAt: new Date(Date.now() - 60_000).toISOString() });
    expect(r.status).toBe(422);
  });

  it('mutations rejected with 410 after end', async () => {
    const admin = await adminToken();
    const { token } = await teamLogin();
    await startContest(admin);
    await api().post('/api/admin/contest/end').set(bearer(admin));
    expect((await submit(token, 1)).status).toBe(410);
    expect((await submit(token, 1, 'wrong answer')).status).toBe(410); // the verdict is not revealed after the end
    expect((await api().post('/api/team/stages/1/hint').set(bearer(token))).status).toBe(410);
  });

  it('grace window: accepted just after end_at, rejected beyond end_at + grace', async () => {
    const admin = await adminToken();
    const { token } = await teamLogin();
    await startContest(admin);

    // deadline 1s ago (inside 2s grace) -> still accepted
    await prisma.contest.update({ where: { id: 1 }, data: { endAt: new Date(Date.now() - 1000) } });
    const accepted = await submit(token, 1);
    expect(accepted.status).toBe(200);
    expect(accepted.body.correct).toBe(true);

    // deadline 5s ago (outside grace) -> 410
    await prisma.contest.update({ where: { id: 1 }, data: { endAt: new Date(Date.now() - 5000) } });
    expect((await submit(token, 2)).status).toBe(410);
  });
});

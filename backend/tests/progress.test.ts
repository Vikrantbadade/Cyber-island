import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { adminToken, api, bearer, prisma, reset, startContest, teamLogin } from './helpers';

async function setup() {
  const admin = await adminToken();
  await startContest(admin);
  const { token } = await teamLogin();
  return { admin, token };
}

describe('stage progression & scoring', () => {
  beforeEach(reset);
  afterAll(() => prisma.$disconnect());

  it('completes stage 1, awards DB score, records elapsed seconds', async () => {
    const { token } = await setup();
    const meta = await prisma.stageMeta.findUniqueOrThrow({ where: { stageId: 1 } });
    const r = await api().post('/api/team/stages/1/complete').set(bearer(token));
    expect(r.status).toBe(200);
    expect(r.body.score).toBe(meta.stageScore);
    expect(r.body.completedStages).toEqual([1]);
    expect(r.body.nextStage).toBe(2);
    expect(r.body.stages[0].completedElapsedSeconds).toBeGreaterThanOrEqual(0);
    expect(r.body.stages[0].completedElapsedSeconds).toBeLessThan(5);
  });

  it('rejects skipping (409) and re-completion (409)', async () => {
    const { token } = await setup();
    expect((await api().post('/api/team/stages/3/complete').set(bearer(token))).status).toBe(409);
    expect((await api().post('/api/team/stages/1/complete').set(bearer(token))).status).toBe(200);
    expect((await api().post('/api/team/stages/1/complete').set(bearer(token))).status).toBe(409);
    const me = await api().get('/api/team/me').set(bearer(token));
    const meta = await prisma.stageMeta.findUniqueOrThrow({ where: { stageId: 1 } });
    expect(me.body.score).toBe(meta.stageScore); // awarded exactly once
  });

  it('unknown stage ids are 404', async () => {
    const { token } = await setup();
    expect((await api().post('/api/team/stages/0/complete').set(bearer(token))).status).toBe(404);
    expect((await api().post('/api/team/stages/13/complete').set(bearer(token))).status).toBe(404);
    expect((await api().post('/api/team/stages/abc/hint').set(bearer(token))).status).toBe(404);
  });

  it('concurrent double-submit awards the stage exactly once', async () => {
    const { token } = await setup();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => api().post('/api/team/stages/1/complete').set(bearer(token))),
    );
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(4);
  });

  it('can complete all 12 stages in order; nextStage becomes null', async () => {
    const { token } = await setup();
    let last: any;
    for (let s = 1; s <= 12; s++) {
      last = await api().post(`/api/team/stages/${s}/complete`).set(bearer(token));
      expect(last.status).toBe(200);
    }
    expect(last.body.nextStage).toBeNull();
    expect(last.body.completedStages).toHaveLength(12);
  });
});

describe('hints', () => {
  beforeEach(reset);
  afterAll(() => prisma.$disconnect());

  it('applies ordered DB penalties and increments usage', async () => {
    const { token } = await setup();
    const hints = await prisma.stageHint.findMany({ where: { stageId: 1 }, orderBy: { hintOrder: 'asc' } });
    let expectedPenalty = 0;
    for (let i = 0; i < hints.length; i++) {
      const r = await api().post('/api/team/stages/1/hint').set(bearer(token));
      expect(r.status).toBe(200);
      expectedPenalty += hints[i].penalty;
      expect(r.body.hintOrder).toBe(i + 1);
      expect(r.body.penalty).toBe(expectedPenalty);
    }
    // exhausted
    expect((await api().post('/api/team/stages/1/hint').set(bearer(token))).status).toBe(409);
    const p = await api().get('/api/team/progress').set(bearer(token));
    expect(p.body.stages[0].hintsUsed).toBe(hints.length);
    expect(p.body.penalty).toBe(expectedPenalty);
  });

  it('rejects hints for stages not yet reached (409)', async () => {
    const { token } = await setup();
    expect((await api().post('/api/team/stages/5/hint').set(bearer(token))).status).toBe(409);
  });
});

describe('admin team operations', () => {
  beforeEach(reset);
  afterAll(() => prisma.$disconnect());

  it('manual completion is sequential-only', async () => {
    const { admin } = await setup();
    const team = await prisma.team.findUniqueOrThrow({ where: { loginName: 'alpha' } });
    const url = (s: number) => `/api/admin/teams/${team.id}/stages/${s}/complete`;
    expect((await api().post(url(2)).set(bearer(admin))).status).toBe(409);
    const ok = await api().post(url(1)).set(bearer(admin));
    expect(ok.status).toBe(200);
    expect(ok.body.completedStages).toBe(1);
    expect((await api().post(url(1)).set(bearer(admin))).status).toBe(409);
  });

  it('sets score and penalty; rejects negatives (422)', async () => {
    const { admin } = await setup();
    const team = await prisma.team.findUniqueOrThrow({ where: { loginName: 'alpha' } });
    const s = await api().patch(`/api/admin/teams/${team.id}/score`).set(bearer(admin)).send({ score: 250 });
    expect(s.body.score).toBe(250);
    const p = await api().patch(`/api/admin/teams/${team.id}/penalty`).set(bearer(admin)).send({ penalty: 30 });
    expect(p.body.netScore).toBe(220);
    expect((await api().patch(`/api/admin/teams/${team.id}/score`).set(bearer(admin)).send({ score: -1 })).status).toBe(422);
  });

  it('lists/filter/sorts teams', async () => {
    const { admin } = await setup();
    const r = await api().get('/api/admin/teams?q=brav&sortBy=score&order=desc').set(bearer(admin));
    expect(r.status).toBe(200);
    expect(r.body.teams.map((t: any) => t.loginName)).toEqual(['bravo']);
    expect((await api().get('/api/admin/teams?sortBy=bogus').set(bearer(admin))).status).toBe(400);
  });

  it('leaderboard ranks by net score then earlier final-stage time', async () => {
    const { admin } = await setup();
    const [a, b] = await Promise.all(
      ['alpha', 'bravo'].map((loginName) => prisma.team.findUniqueOrThrow({ where: { loginName } })),
    );
    // equal net score; bravo finished stage 12 earlier
    await prisma.team.update({ where: { id: a.id }, data: { score: 1200 } });
    await prisma.team.update({ where: { id: b.id }, data: { score: 1200 } });
    await prisma.teamProgress.update({ where: { teamId: a.id }, data: { stage12CompletedElapsed: 900 } });
    await prisma.teamProgress.update({ where: { teamId: b.id }, data: { stage12CompletedElapsed: 600 } });
    const r = await api().get('/api/admin/leaderboard').set(bearer(admin));
    expect(r.body.entries[0].loginName).toBe('bravo');
    expect(r.body.entries[1].loginName).toBe('alpha');
  });
});

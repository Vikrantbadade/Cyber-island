import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { STAGES } from '../src/config/stages';
import { ANSWER_THROTTLE } from '../src/services/answer-throttle';
import { TOTAL_STAGES } from '../src/utils/progress';
import { adminToken, answerFor, api, bearer, prisma, reset, startContest, submit, teamLogin } from './helpers';

async function setup() {
  const admin = await adminToken();
  await startContest(admin);
  const { token } = await teamLogin();
  return { admin, token };
}

describe('stage progression & scoring', () => {
  beforeEach(reset);
  afterAll(() => prisma.$disconnect());

  it('the game has 6 stages', () => {
    expect(TOTAL_STAGES).toBe(6);
    expect(STAGES).toHaveLength(6);
  });

  it('correct answer completes stage 1, awards DB score, records elapsed seconds', async () => {
    const { token } = await setup();
    const meta = await prisma.stageMeta.findUniqueOrThrow({ where: { stageId: 1 } });
    const r = await submit(token, 1);
    expect(r.status).toBe(200);
    expect(r.body.correct).toBe(true);
    const p = r.body.progress;
    expect(p.score).toBe(meta.stageScore);
    expect(p.completedStages).toEqual([1]);
    expect(p.nextStage).toBe(2);
    expect(p.stages[0].completedElapsedSeconds).toBeGreaterThanOrEqual(0);
    expect(p.stages[0].completedElapsedSeconds).toBeLessThan(5);
  });

  it('answers are case-insensitive and ignore surrounding / repeated whitespace', async () => {
    const { token } = await setup();
    const r = await submit(token, 1, `   ${answerFor(1).toLowerCase().replace(' ', '    ')}  `);
    expect(r.status).toBe(200);
    expect(r.body.correct).toBe(true);
  });

  it('a wrong answer is a normal 200 { correct: false } and records nothing', async () => {
    const { token } = await setup();
    const r = await submit(token, 1, 'definitely not it');
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ correct: false });
    const p = await api().get('/api/team/progress').set(bearer(token));
    expect(p.body.completedStages).toEqual([]);
    expect(p.body.score).toBe(0);
  });

  it('the old self-service /complete route is gone for teams', async () => {
    const { token } = await setup();
    expect((await api().post('/api/team/stages/1/complete').set(bearer(token))).status).toBe(404);
  });

  it('an empty or missing answer is 400', async () => {
    const { token } = await setup();
    const url = '/api/team/stages/1/submit';
    expect((await api().post(url).set(bearer(token)).send({ answer: '   ' })).status).toBe(400);
    expect((await api().post(url).set(bearer(token)).send({})).status).toBe(400);
  });

  it('rejects skipping (409) and re-completion (409), even with the right answer', async () => {
    const { token } = await setup();
    expect((await submit(token, 3)).status).toBe(409);
    expect((await submit(token, 1)).status).toBe(200);
    expect((await submit(token, 1)).status).toBe(409);
    const me = await api().get('/api/team/me').set(bearer(token));
    const meta = await prisma.stageMeta.findUniqueOrThrow({ where: { stageId: 1 } });
    expect(me.body.score).toBe(meta.stageScore); // awarded exactly once
  });

  it('later stages are not an answer oracle: right and wrong guesses both get 409', async () => {
    const { token } = await setup();
    const right = await submit(token, 4, answerFor(4));
    const wrong = await submit(token, 4, 'nonsense');
    expect(right.status).toBe(409);
    expect(wrong.status).toBe(409);
    expect(right.body.error.message).toBe(wrong.body.error.message);
  });

  it('unknown stage ids are 404', async () => {
    const { token } = await setup();
    expect((await submit(token, 0, 'x')).status).toBe(404);
    expect((await submit(token, 7, 'x')).status).toBe(404);
    expect((await api().post('/api/team/stages/abc/hint').set(bearer(token))).status).toBe(404);
  });

  it('concurrent double-submit awards the stage exactly once', async () => {
    const { token } = await setup();
    const results = await Promise.all(Array.from({ length: 5 }, () => submit(token, 1)));
    expect(results.filter((r) => r.status === 200 && r.body.correct === true)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(4);
  });

  it('can complete all 6 stages in order; nextStage becomes null', async () => {
    const { token } = await setup();
    let last: any;
    for (let s = 1; s <= TOTAL_STAGES; s++) {
      last = await submit(token, s);
      expect(last.status).toBe(200);
    }
    expect(last.body.correct).toBe(true);
    expect(last.body.progress.nextStage).toBeNull();
    expect(last.body.progress.completedStages).toHaveLength(6);
  });

  it('too many wrong answers are throttled (429), and a correct answer is held back until the window passes', async () => {
    const { token } = await setup();
    for (let i = 0; i < ANSWER_THROTTLE.MAX_WRONG; i++) {
      const wrong = await submit(token, 1, `wrong ${i}`);
      expect(wrong.status).toBe(200);
      expect(wrong.body.correct).toBe(false);
    }
    const blocked = await submit(token, 1, 'wrong again');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_ATTEMPTS');
    expect((await submit(token, 1)).status).toBe(429);
  });
});

describe('hints', () => {
  beforeEach(reset);
  afterAll(() => prisma.$disconnect());

  it('applies ordered DB penalties, returns the hint text and increments usage', async () => {
    const { token } = await setup();
    const dbHints = await prisma.stageHint.findMany({ where: { stageId: 1 }, orderBy: { hintOrder: 'asc' } });
    const count = Math.min(dbHints.length, STAGES[0].hints.length);
    expect(count).toBeGreaterThan(0);

    let expectedPenalty = 0;
    for (let i = 0; i < count; i++) {
      const r = await api().post('/api/team/stages/1/hint').set(bearer(token));
      expect(r.status).toBe(200);
      expectedPenalty += dbHints[i].penalty;
      expect(r.body.hintOrder).toBe(i + 1);
      expect(r.body.hintText).toBe(STAGES[0].hints[i].text);
      expect(r.body.penalty).toBe(expectedPenalty);
    }
    // exhausted
    expect((await api().post('/api/team/stages/1/hint').set(bearer(token))).status).toBe(409);
    const p = await api().get('/api/team/progress').set(bearer(token));
    expect(p.body.stages[0].hintsUsed).toBe(count);
    expect(p.body.penalty).toBe(expectedPenalty);
  });

  it('progress exposes only the hints the team has already paid for', async () => {
    const { token } = await setup();
    const before = await api().get('/api/team/progress').set(bearer(token));
    expect(before.body.stages[0].hints).toEqual([]);
    expect(before.body.stages[0].hintsAvailable).toBeGreaterThan(0);
    expect(JSON.stringify(before.body)).not.toContain('dcode.fr'); // no locked hint text

    await api().post('/api/team/stages/1/hint').set(bearer(token));
    const after = await api().get('/api/team/progress').set(bearer(token));
    expect(after.body.stages[0].hints).toEqual([STAGES[0].hints[0].text]);
    expect(after.body.stages[1].hints).toEqual([]);
  });

  it('progress never contains answers', async () => {
    const { token } = await setup();
    const p = await api().get('/api/team/progress').set(bearer(token));
    const body = JSON.stringify(p.body).toUpperCase();
    for (const stage of STAGES) for (const a of stage.answers) expect(body).not.toContain(`"${a.toUpperCase()}"`);
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

  it('leaderboard ranks by net score then earlier final-stage (stage 6) time', async () => {
    const { admin } = await setup();
    const [a, b] = await Promise.all(
      ['alpha', 'bravo'].map((loginName) => prisma.team.findUniqueOrThrow({ where: { loginName } })),
    );
    // equal net score; bravo finished stage 6 earlier
    await prisma.team.update({ where: { id: a.id }, data: { score: 600 } });
    await prisma.team.update({ where: { id: b.id }, data: { score: 600 } });
    await prisma.teamProgress.update({ where: { teamId: a.id }, data: { stage6CompletedElapsed: 900 } });
    await prisma.teamProgress.update({ where: { teamId: b.id }, data: { stage6CompletedElapsed: 600 } });
    const r = await api().get('/api/admin/leaderboard').set(bearer(admin));
    expect(r.body.entries[0].loginName).toBe('bravo');
    expect(r.body.entries[0].finalStageElapsed).toBe(600);
    expect(r.body.entries[1].loginName).toBe('alpha');
  });
});

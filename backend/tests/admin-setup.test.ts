import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { STAGES } from '../src/config/stages';
import { TOTAL_STAGES } from '../src/utils/progress';
import { adminToken, api, bearer, prisma, reset, startContest, teamLogin } from './helpers';

const PREFIX = 'zz-setup-';
const EXPECTED_HINTS = STAGES.reduce((n, s) => n + s.hints.length, 0);

async function cleanup() {
  await prisma.team.deleteMany({ where: { loginName: { startsWith: PREFIX } } });
}

describe('manual setup (initialize game data + import teams)', () => {
  let admin: string;

  beforeAll(async () => {
    await cleanup();
    await reset();
    admin = await adminToken();
  });

  afterAll(async () => {
    await cleanup();
    await reset();
    await prisma.$disconnect();
  });

  it('every setup endpoint requires an admin token', async () => {
    expect((await api().get('/api/admin/setup/status')).status).toBe(401);
    expect((await api().post('/api/admin/setup/initialize')).status).toBe(401);
    expect((await api().post('/api/admin/setup/teams').send({ teams: [] })).status).toBe(401);
    const { token } = await teamLogin();
    expect((await api().get('/api/admin/setup/status').set(bearer(token))).status).toBe(403);
  });

  it('reports the setup status', async () => {
    const r = await api().get('/api/admin/setup/status').set(bearer(admin));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      initialized: true,
      contestExists: true,
      stages: TOTAL_STAGES,
      expectedStages: TOTAL_STAGES,
      hints: EXPECTED_HINTS,
      expectedHints: EXPECTED_HINTS,
    });
    expect(r.body.teams).toBeGreaterThan(0);
  });

  it('initialize is idempotent and never touches teams, scores or progress', async () => {
    const alpha = await prisma.team.findUniqueOrThrow({ where: { loginName: 'alpha' } });
    await prisma.team.update({ where: { id: alpha.id }, data: { score: 123, penalty: 7 } });

    for (let i = 0; i < 2; i++) {
      const r = await api().post('/api/admin/setup/initialize').set(bearer(admin));
      expect(r.status).toBe(200);
      expect(r.body.initialized).toBe(true);
    }
    const after = await prisma.team.findUniqueOrThrow({ where: { id: alpha.id } });
    expect([after.score, after.penalty]).toEqual([123, 7]);

    const metas = await prisma.stageMeta.findMany({ orderBy: { stageId: 'asc' } });
    expect(metas.map((m) => m.stageScore)).toEqual(STAGES.map((s) => s.score));
  });

  it('initialize restores removed stages and re-creates the teams\' hint rows', async () => {
    const alpha = await prisma.team.findUniqueOrThrow({ where: { loginName: 'alpha' } });
    await prisma.stageMeta.delete({ where: { stageId: TOTAL_STAGES } }); // cascades to hints + hint progress
    const broken = await api().get('/api/admin/setup/status').set(bearer(admin));
    expect(broken.body.initialized).toBe(false);

    const r = await api().post('/api/admin/setup/initialize').set(bearer(admin));
    expect(r.status).toBe(200);
    expect(r.body.initialized).toBe(true);
    expect(await prisma.teamHintProgress.count({ where: { teamId: alpha.id } })).toBe(TOTAL_STAGES);
  });

  it('works on an empty database: status endpoint says "missing", initialize creates the contest', async () => {
    await reset();
    await prisma.contest.delete({ where: { id: 1 } });

    const status = await api().get('/api/contest/status').set(bearer(admin));
    expect(status.status).toBe(503);
    expect(status.body.error.code).toBe('CONTEST_MISSING');
    const setup = await api().get('/api/admin/setup/status').set(bearer(admin));
    expect(setup.body).toMatchObject({ initialized: false, contestExists: false });

    const r = await api().post('/api/admin/setup/initialize').set(bearer(admin));
    expect(r.status).toBe(200);
    expect(r.body.initialized).toBe(true);

    const after = await api().get('/api/contest/status').set(bearer(admin));
    expect(after.status).toBe(200);
    expect(after.body.status).toBe('NOT_STARTED');
  });

  it('initialize is refused while the contest is RUNNING (409)', async () => {
    await reset();
    expect((await startContest(admin)).status).toBe(200);
    const r = await api().post('/api/admin/setup/initialize').set(bearer(admin));
    expect(r.status).toBe(409);
    await reset();
  });

  it('imports teams: creates new ones, updates existing ones, keeps their progress', async () => {
    const first = await api()
      .post('/api/admin/setup/teams')
      .set(bearer(admin))
      .send({
        teams: [
          { name: 'Setup One', loginName: `${PREFIX}one`, password: 'pw-one' },
          { name: 'Setup Two', loginName: `${PREFIX}two`, password: 'pw-two' },
        ],
      });
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ created: 2, updated: 0, total: 2 });

    // new teams are immediately playable: login works and the progress rows exist
    const login = await teamLogin(`${PREFIX}one`, 'pw-one');
    expect(login.res.status).toBe(201);
    const one = await prisma.team.findUniqueOrThrow({ where: { loginName: `${PREFIX}one` } });
    expect(await prisma.teamProgress.findUnique({ where: { teamId: one.id } })).not.toBeNull();
    expect(await prisma.teamHintProgress.count({ where: { teamId: one.id } })).toBe(TOTAL_STAGES);

    await prisma.team.update({ where: { id: one.id }, data: { score: 250 } });
    const second = await api()
      .post('/api/admin/setup/teams')
      .set(bearer(admin))
      .send({
        teams: [
          { name: 'Setup One Renamed', loginName: `${PREFIX}one`, password: 'new-pw' },
          { name: 'Setup Three', loginName: `${PREFIX}three`, password: 'pw-three' },
        ],
      });
    expect(second.body).toMatchObject({ created: 1, updated: 1, total: 2 });

    const updated = await prisma.team.findUniqueOrThrow({ where: { id: one.id } });
    expect(updated.name).toBe('Setup One Renamed');
    expect(updated.score).toBe(250); // progress / score untouched
    expect((await teamLogin(`${PREFIX}one`, 'pw-one')).res.status).toBe(401);
    expect((await teamLogin(`${PREFIX}one`, 'new-pw')).res.status).toBe(201);
    // not in the second file, but not deleted either
    expect(await prisma.team.findUnique({ where: { loginName: `${PREFIX}two` } })).not.toBeNull();
  });

  it('rejects bad import bodies (400) without creating anything', async () => {
    const post = (body: unknown) => api().post('/api/admin/setup/teams').set(bearer(admin)).send(body as object);
    const team = (loginName: string) => ({ name: 'X', loginName, password: 'pw' });

    expect((await post({ teams: [] })).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect((await post({ teams: [team('has space')] })).status).toBe(400);
    expect((await post({ teams: [{ name: '', loginName: `${PREFIX}x`, password: 'pw' }] })).status).toBe(400);
    const dup = await post({ teams: [team(`${PREFIX}dup`), team(`${PREFIX}dup`)] });
    expect(dup.status).toBe(400);
    expect(dup.body.error.message).toContain('Duplicate');
    expect(await prisma.team.count({ where: { loginName: { startsWith: `${PREFIX}dup` } } })).toBe(0);
  });
});

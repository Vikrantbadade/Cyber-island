import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { installTeamTriggers } from '../src/services/team-integrity.service';
import { adminToken, api, bearer, prisma, reset, startContest, submit, teamLogin } from './helpers';

const PREFIX = 'zz-test-';

async function cleanup() {
  await prisma.team.deleteMany({ where: { loginName: { startsWith: PREFIX } } });
}

describe('admin team create / delete + teams added directly in the DB', () => {
  let admin: string;
  let stageCount: number;

  beforeAll(async () => {
    await cleanup();
    await reset();
    await installTeamTriggers(); // normally done by server.ts at boot
    admin = await adminToken();
    stageCount = await prisma.stageMeta.count();
  });

  afterAll(async () => {
    await cleanup();
    await reset();
    await prisma.$disconnect();
  });

  it('requires an admin token', async () => {
    const body = { name: 'X', loginName: `${PREFIX}noauth`, password: 'pw' };
    expect((await api().post('/api/admin/teams').send(body)).status).toBe(401);
    expect((await api().delete('/api/admin/teams/00000000-0000-4000-8000-000000000000')).status).toBe(401);
  });

  it('creates a team with its progress and hint rows, and it shows up in the leaderboard', async () => {
    const res = await api()
      .post('/api/admin/teams')
      .set(bearer(admin))
      .send({ name: 'Zed Team', loginName: `${PREFIX}create`, password: 'secret1' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Zed Team',
      loginName: `${PREFIX}create`,
      completedStages: 0,
      nextStage: 1,
      score: 0,
      penalty: 0,
    });
    expect(res.body.stages).toHaveLength(6);
    expect(res.body).not.toHaveProperty('passwordPlaintext');

    const id = res.body.id as string;
    expect(await prisma.teamProgress.findUnique({ where: { teamId: id } })).not.toBeNull();
    expect(await prisma.teamHintProgress.count({ where: { teamId: id } })).toBe(stageCount);

    const board = await api().get('/api/admin/leaderboard?page=1&pageSize=500').set(bearer(admin));
    expect(board.body.entries.some((e: { id: string }) => e.id === id)).toBe(true);
  });

  it('rejects a duplicate login ID with 409', async () => {
    const res = await api()
      .post('/api/admin/teams')
      .set(bearer(admin))
      .send({ name: 'Zed Again', loginName: `${PREFIX}create`, password: 'other' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('validates the body', async () => {
    const post = (body: object) => api().post('/api/admin/teams').set(bearer(admin)).send(body);
    expect((await post({ name: '', loginName: `${PREFIX}v1`, password: 'pw' })).status).toBe(400);
    expect((await post({ name: 'A', loginName: '', password: 'pw' })).status).toBe(400);
    expect((await post({ name: 'A', loginName: 'has space', password: 'pw' })).status).toBe(400);
    expect((await post({ name: 'A', loginName: `${PREFIX}v2`, password: '' })).status).toBe(400);
    expect((await post({ name: 'A', loginName: `${PREFIX}v3` })).status).toBe(400);
  });

  it('a newly created team can log in and play right away', async () => {
    await reset();
    expect((await startContest(admin)).status).toBe(200);

    const { res, token } = await teamLogin(`${PREFIX}create`, 'secret1');
    expect(res.status).toBe(201);

    const done = await submit(token, 1);
    expect(done.status).toBe(200);
    expect(done.body.correct).toBe(true);
    expect(done.body.progress.completedStages).toEqual([1]);

    const hint = await api().post('/api/team/stages/2/hint').set(bearer(token));
    expect(hint.status).toBe(200);
  });

  it('deletes a team: rows are gone, its tokens stop working, it can no longer log in', async () => {
    const { token, refresh } = await teamLogin(`${PREFIX}create`, 'secret1');
    const list = await api().get('/api/admin/teams?q=Zed').set(bearer(admin));
    const id = list.body.teams.find((t: { loginName: string }) => t.loginName === `${PREFIX}create`).id as string;

    const del = await api().delete(`/api/admin/teams/${id}`).set(bearer(admin));
    expect(del.status).toBe(200);
    expect(del.body).toMatchObject({ deleted: true, id, loginName: `${PREFIX}create` });

    expect(await prisma.team.findUnique({ where: { id } })).toBeNull();
    expect(await prisma.teamProgress.findUnique({ where: { teamId: id } })).toBeNull();
    expect(await prisma.teamHintProgress.count({ where: { teamId: id } })).toBe(0);
    expect(await prisma.teamSession.findUnique({ where: { teamId: id } })).toBeNull();

    expect((await api().get('/api/team/progress').set(bearer(token))).status).toBe(401);
    expect((await api().post('/api/auth/refresh').send({ refreshToken: refresh })).status).toBe(401);
    expect((await teamLogin(`${PREFIX}create`, 'secret1')).res.status).toBe(401);

    const board = await api().get('/api/admin/leaderboard?page=1&pageSize=500').set(bearer(admin));
    expect(board.body.entries.some((e: { id: string }) => e.id === id)).toBe(false);
    expect((await api().get(`/api/admin/teams/${id}`).set(bearer(admin))).status).toBe(404);
  });

  it('delete: unknown team -> 404, malformed id -> 400', async () => {
    const missing = await api().delete('/api/admin/teams/00000000-0000-4000-8000-000000000000').set(bearer(admin));
    expect(missing.status).toBe(404);
    expect((await api().delete('/api/admin/teams/not-a-uuid').set(bearer(admin))).status).toBe(400);
  });

  it('a team inserted with plain SQL gets an id and its progress rows (DB default + trigger)', async () => {
    await prisma.$executeRawUnsafe(
      'INSERT INTO teams (name, login_name, password_plaintext) VALUES ($1, $2, $3)',
      'Raw Team',
      `${PREFIX}raw`,
      'rawpw',
    );
    const team = await prisma.team.findUniqueOrThrow({ where: { loginName: `${PREFIX}raw` } });
    expect(team.id).toBeTruthy();
    expect(await prisma.teamProgress.findUnique({ where: { teamId: team.id } })).not.toBeNull();
    expect(await prisma.teamHintProgress.count({ where: { teamId: team.id } })).toBe(stageCount);

    await reset();
    await startContest(admin);
    const { res, token } = await teamLogin(`${PREFIX}raw`, 'rawpw');
    expect(res.status).toBe(201);
    expect((await submit(token, 1)).status).toBe(200);
  });

  it('a team whose progress rows are missing is healed on login (no trigger needed)', async () => {
    const team = await prisma.team.create({
      data: { name: 'Bare Team', loginName: `${PREFIX}bare`, passwordPlaintext: 'barepw' },
    });
    await prisma.teamProgress.deleteMany({ where: { teamId: team.id } });
    await prisma.teamHintProgress.deleteMany({ where: { teamId: team.id } });

    await reset();
    await startContest(admin);
    const { res, token } = await teamLogin(`${PREFIX}bare`, 'barepw');
    expect(res.status).toBe(201);

    const progress = await api().get('/api/team/progress').set(bearer(token));
    expect(progress.status).toBe(200);
    expect(progress.body.stages).toHaveLength(6);
    expect((await submit(token, 1)).status).toBe(200);
  });

  it('admin manual stage completion also works for a team that lost its rows', async () => {
    const team = await prisma.team.findUniqueOrThrow({ where: { loginName: `${PREFIX}bare` } });
    await prisma.teamProgress.deleteMany({ where: { teamId: team.id } });

    await reset();
    await startContest(admin);
    const res = await api().post(`/api/admin/teams/${team.id}/stages/1/complete`).set(bearer(admin));
    expect(res.status).toBe(200);
    expect(res.body.completedStages).toBe(1);
  });
});

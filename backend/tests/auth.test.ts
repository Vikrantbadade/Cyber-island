import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { adminToken, api, bearer, prisma, reset, teamLogin } from './helpers';

describe('auth', () => {
  beforeEach(reset);
  afterAll(() => prisma.$disconnect());

  it('logs a team in and returns both tokens', async () => {
    const { res } = await teamLogin();
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('rejects bad credentials', async () => {
    const { res } = await teamLogin('alpha', 'wrong');
    expect(res.status).toBe(401);
  });

  it('second login invalidates the first session', async () => {
    const first = await teamLogin();
    const second = await teamLogin();
    expect((await api().get('/api/team/me').set(bearer(first.token))).status).toBe(401);
    expect((await api().get('/api/team/me').set(bearer(second.token))).status).toBe(200);
    // old refresh token is dead too
    expect((await api().post('/api/auth/refresh').send({ refreshToken: first.refresh })).status).toBe(401);
  });

  it('refresh issues a working access token', async () => {
    const { refresh } = await teamLogin();
    const r = await api().post('/api/auth/refresh').send({ refreshToken: refresh });
    expect(r.status).toBe(200);
    expect((await api().get('/api/team/me').set(bearer(r.body.accessToken))).status).toBe(200);
  });

  it('access token cannot be used as refresh token', async () => {
    const { token } = await teamLogin();
    expect((await api().post('/api/auth/refresh').send({ refreshToken: token })).status).toBe(401);
  });

  it('team token is forbidden on admin routes, admin token works', async () => {
    const { token } = await teamLogin();
    expect((await api().get('/api/admin/teams').set(bearer(token))).status).toBe(403);
    expect((await api().get('/api/admin/teams').set(bearer(await adminToken()))).status).toBe(200);
  });

  it('requires a token on team routes', async () => {
    expect((await api().get('/api/team/me')).status).toBe(401);
  });
});

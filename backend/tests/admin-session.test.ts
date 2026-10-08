import jwt from 'jsonwebtoken';
import { afterAll, describe, expect, it } from 'vitest';
import { adminToken, api, bearer, prisma, reset, teamLogin } from './helpers';

const PROTECTED = ['/api/admin/teams', '/api/admin/leaderboard', '/api/admin/setup/status', '/api/contest/status'];

describe('single admin session', () => {
  afterAll(async () => {
    await reset();
    await prisma.$disconnect();
  });

  it('a new admin login signs out the previous one everywhere', async () => {
    const first = await adminToken();
    for (const url of PROTECTED) expect((await api().get(url).set(bearer(first))).status).toBe(200);

    const second = await adminToken();
    expect(second).not.toBe(first);
    for (const url of PROTECTED) {
      expect((await api().get(url).set(bearer(first))).status).toBe(401);
      expect((await api().get(url).set(bearer(second))).status).toBe(200);
    }
  });

  it('a failed login does not disturb the current session', async () => {
    const token = await adminToken();
    const bad = await api().post('/api/admin/auth/login').send({ loginName: 'admin', password: 'definitely-wrong' });
    expect(bad.status).toBe(401);
    const badName = await api()
      .post('/api/admin/auth/login')
      .send({ loginName: 'not-the-admin', password: process.env.ADMIN_PASSWORD });
    expect(badName.status).toBe(401);
    expect((await api().get('/api/admin/teams').set(bearer(token))).status).toBe(200);
  });

  it('an expired admin session is rejected until the admin logs in again', async () => {
    const token = await adminToken();
    await prisma.adminSession.update({ where: { id: 1 }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await api().get('/api/admin/teams').set(bearer(token))).status).toBe(401);
    const fresh = await adminToken();
    expect((await api().get('/api/admin/teams').set(bearer(fresh))).status).toBe(200);
  });

  it('an admin token without a session id (legacy or forged) is rejected', async () => {
    await adminToken(); // make sure an admin session exists
    const legacy = jwt.sign({ sub: 'admin', role: 'admin', typ: 'access' }, process.env.JWT_ACCESS_SECRET as string, {
      expiresIn: '1h',
    });
    expect((await api().get('/api/admin/teams').set(bearer(legacy))).status).toBe(401);
    const wrongSid = jwt.sign(
      { sub: 'admin', sid: '00000000-0000-4000-8000-000000000000', role: 'admin', typ: 'access' },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: '1h' },
    );
    expect((await api().get('/api/admin/teams').set(bearer(wrongSid))).status).toBe(401);
  });

  it('team logins and tokens are not affected by admin logins', async () => {
    const { token } = await teamLogin();
    await adminToken();
    await adminToken();
    expect((await api().get('/api/team/me').set(bearer(token))).status).toBe(200);
    expect((await api().get('/api/contest/status').set(bearer(token))).status).toBe(200);
  });
});

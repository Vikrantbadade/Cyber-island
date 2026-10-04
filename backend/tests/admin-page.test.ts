import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { adminToken, api, bearer, prisma } from './helpers';

describe('admin page', () => {
  afterAll(() => prisma.$disconnect());

  it('serves the page at /admin/ with a strict CSP and no cache', async () => {
    const res = await api().get('/admin/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.text).toContain('CyberIsland Admin');
  });

  it('redirects /admin to /admin/ so relative asset URLs resolve', async () => {
    const res = await api().get('/admin');
    expect([301, 302, 307, 308]).toContain(res.status);
    expect(res.headers.location).toBe('/admin/');
  });

  it('serves the script and the stylesheet', async () => {
    const js = await api().get('/admin/admin.js');
    expect(js.status).toBe(200);
    expect(js.headers['content-type']).toContain('javascript');
    const css = await api().get('/admin/admin.css');
    expect(css.status).toBe(200);
    expect(css.headers['content-type']).toContain('text/css');
  });

  it('index.html has no inline scripts or style attributes (the CSP would block them)', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'admin', 'index.html'), 'utf8');
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)/i);
    expect(html).not.toMatch(/\sstyle\s*=/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i); // onclick= etc.
  });

  it('the page itself carries no data and every admin data endpoint stays protected', async () => {
    expect((await api().get('/api/admin/leaderboard')).status).toBe(401);
    expect((await api().get('/api/admin/teams')).status).toBe(401);
    expect((await api().post('/api/admin/contest/start')).status).toBe(401);
    expect((await api().get('/api/admin/results/csv')).status).toBe(401);
  });

  it('leaderboard returns the fields the page reads', async () => {
    const token = await adminToken();
    const res = await api().get('/api/admin/leaderboard?page=1&pageSize=500').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.entries)).toBe(true);
    if (res.body.entries.length > 0) {
      for (const key of [
        'rank', 'id', 'name', 'loginName', 'completedStages', 'nextStage',
        'score', 'penalty', 'netScore', 'finalStageElapsed', 'sessionActive',
      ]) {
        expect(res.body.entries[0]).toHaveProperty(key);
      }
    }
  });

  it('admin token can read contest status (used by the page for the countdown)', async () => {
    const token = await adminToken();
    const res = await api().get('/api/contest/status').set(bearer(token));
    expect(res.status).toBe(200);
    for (const key of ['status', 'startAt', 'endAt', 'durationMinutes', 'timezone', 'remainingSeconds', 'resultsFinalized']) {
      expect(res.body).toHaveProperty(key);
    }
  });
});

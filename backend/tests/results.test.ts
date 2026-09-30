import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { adminToken, api, bearer, prisma, reset, startContest } from './helpers';

describe('official results', () => {
  beforeEach(reset);
  afterAll(() => prisma.$disconnect());

  it('finalize requires ENDED contest (409 while running / not started)', async () => {
    const admin = await adminToken();
    expect((await api().post('/api/admin/results/finalize').set(bearer(admin))).status).toBe(409);
    await startContest(admin);
    expect((await api().post('/api/admin/results/finalize').set(bearer(admin))).status).toBe(409);
  });

  it('CSV before finalize is 404', async () => {
    const admin = await adminToken();
    expect((await api().get('/api/admin/results/csv').set(bearer(admin))).status).toBe(404);
  });

  it('freezes snapshot: later live edits do not change the CSV; second finalize is 409', async () => {
    const admin = await adminToken();
    await startContest(admin);
    const alpha = await prisma.team.findUniqueOrThrow({ where: { loginName: 'alpha' } });
    await prisma.team.update({ where: { id: alpha.id }, data: { score: 500, penalty: 50 } });
    await api().post('/api/admin/contest/end').set(bearer(admin));

    const fin = await api().post('/api/admin/results/finalize').set(bearer(admin));
    expect(fin.status).toBe(200);
    expect((await api().post('/api/admin/results/finalize').set(bearer(admin))).status).toBe(409);

    // mutate live data after finalization
    await api().patch(`/api/admin/teams/${alpha.id}/score`).set(bearer(admin)).send({ score: 9999 });

    const csv = await api().get('/api/admin/results/csv').set(bearer(admin));
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    const lines = csv.text.trim().split(/\r?\n/);
    expect(lines[0]).toBe('rank,team_id,team_name,score,penalty,net_score,final_stage_elapsed_seconds');
    expect(lines[1]).toContain(`${alpha.id},Team Alpha,500,50,450,`); // rank 1, frozen values
    expect(lines).toHaveLength(1 + (await prisma.team.count()));
  });

  it('extend after finalize is refused (409)', async () => {
    const admin = await adminToken();
    await startContest(admin);
    await api().post('/api/admin/contest/end').set(bearer(admin));
    await api().post('/api/admin/results/finalize').set(bearer(admin));
    const r = await api().post('/api/admin/contest/extend-duration').set(bearer(admin)).send({ additionalMinutes: 5 });
    expect(r.status).toBe(409);
  });
});

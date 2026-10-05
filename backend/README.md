# CyberIsland Backend

Authoritative game-state service for *CyberIsland: The Last Signal* (Express + TypeScript + Prisma + PostgreSQL).
Full spec: [`cyberisland-backend-spec.md`](./cyberisland-backend-spec.md). Progress notes: [`CLAUDE.md`](./CLAUDE.md).

## Status (2026-10-05)

- Backend is complete and verified: typecheck, `db push`, seed, integration tests and `docker compose up --build` all run clean.
- The frontend (`../frontend`) is integrated: team login/refresh, contest status, stage completion, hints, progress restore.
- **Admin web page:** `http://<this machine>:3000/admin` (see "Admin page"). Prisma Studio, the admin API and SQL remain available for deeper inspection.
- Contest start is **manual only** (no scheduler, by spec).
- Open decision: the backend has 12 stages, the frontend currently has 6 challenges (frontend maps challenge N -> stage N; stages 7-12 unused).
- Seed scores, hint penalties, sample teams and secrets are placeholders.

## Quick start (Docker, everything)

```bash
docker compose up --build
```

This starts PostgreSQL and the API on `:3000`. On boot the backend runs `prisma db push` and the (idempotent) seed.

## Local dev (API on host, DB in Docker)

```bash
pnpm install
docker compose up -d db
pnpm prisma generate
pnpm prisma db push
pnpm seed
pnpm dev            # http://localhost:3000/api/health
```

`.env` uses `localhost:5432` for host-side work; compose overrides `DATABASE_URL` to `db:5432` for the container.

## Before the event

1. **Teams** – easiest: add/remove them live from the admin page ("Add team" / team dialog -> "Delete team"). Alternatively create `prisma/teams.json`: `[{ "name": "...", "loginName": "...", "password": "..." }]`, then `pnpm seed`
   (re-seeding upserts teams and never resets progress/score of existing ones).
2. **Stage scores / hint penalties** – edit `prisma/seed-data.ts`, then `pnpm seed`.
3. **Secrets** – change `JWT_*_SECRET`, `ADMIN_PASSWORD` in `.env`; set `CONTEST_DURATION_MINUTES`.
4. Re-seed after changing teams: run `pnpm seed` **from the host** (Postgres is exposed on `localhost:5432`). `prisma/teams.json` is copied into the Docker image at build time, so editing it and only restarting the container (or `docker compose exec backend pnpm seed`) does **not** pick up the change; rebuild with `docker compose up -d --build backend` if you want to seed inside the container. Re-seeding never resets progress/score of existing teams and never deletes teams removed from the file.
5. Keep `prisma/teams.json` out of git (it holds plaintext access codes).

## Scripts

| Script | What |
|---|---|
| `pnpm dev` | tsx watch server |
| `pnpm build` / `pnpm start` | compile to `dist/` / run compiled |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm seed` | seed contest, 12 stages, hints, teams |
| `pnpm test` | integration tests (**wipes progress in the DB in `DATABASE_URL`** – use a scratch DB) |

## API summary

Team: `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/team/me`, `GET /api/team/progress`,
`GET /api/contest/status`, `POST /api/team/stages/:id/complete`, `POST /api/team/stages/:id/hint`.

Admin (Bearer admin token from `POST /api/admin/auth/login`): `POST /api/admin/contest/{start,end,extend-duration,set-deadline}`,
`GET /api/admin/teams`, `POST /api/admin/teams` (`{name, loginName, password}` -> 201, 409 if the login ID exists), `GET /api/admin/teams/:id`, `DELETE /api/admin/teams/:id`, `POST /api/admin/teams/:id/stages/:stageId/complete`,
`PATCH /api/admin/teams/:id/{score,penalty}`, `GET /api/admin/leaderboard`,
`POST /api/admin/results/finalize`, `GET /api/admin/results/csv`.

Errors: `{ "error": { "code", "message" } }` with statuses 400/401/403/404/409/410/422/500.
Extra endpoint: `GET /api/health`.

## Admin page

Open `http://localhost:3000/admin` (or `http://<laptop-ip>:3000/admin` from another device). Sign in with `ADMIN_LOGIN_NAME` / `ADMIN_PASSWORD` from `.env`.

- **Live leaderboard:** rank, team, 12-stage progress bar, score, penalty, net, final-stage time, online dot. Auto-refreshes (3/5/10/30s or manual); changed rows flash. Filter by team or login ID.
- **Contest controls:** start, end now, extend by N minutes, set an absolute deadline, finalize official results (once, after the contest has ended), download the official CSV. Buttons are only enabled when the action is valid for the current state, and destructive ones ask for confirmation.
- **Add team** (button above the table): name, login ID, password (with a Generate button). The team can log in and play immediately.
- **Team details** (click a row): per-stage completion times and hints used, plus overrides: complete the team's next stage, set score, set penalty. **Delete team** (danger zone) removes the team and all its data; you must type its login ID to confirm, and its devices are logged out at once.
- **Live CSV export** of the table (clearly separate from the official, frozen result).
- Files live in `backend/admin/` (plain HTML/CSS/JS, no build step, no external resources) and are served by Express at `/admin`; the Dockerfile copies the folder into the image, so rebuild after changing it (`docker compose up -d --build backend`; with `pnpm dev` a browser refresh is enough).
- Security: the page files contain no data. Every call goes to `/api/admin/*` and needs an admin JWT (valid for `JWT_REFRESH_EXPIRES_IN`, default 6h; the page returns to the login screen when it expires). The JWT is kept in `sessionStorage` (cleared when the tab closes). A strict Content-Security-Policy is sent and all API data is rendered with `textContent`. Use a strong `ADMIN_PASSWORD`: anyone on the network can reach the login form.

## Adding / removing teams while the backend is running

A team needs a `team_progress` row and one `team_hint_progress` row per stage. The backend now guarantees them in four ways, so teams can be added by any route without crashing or stalling play:

1. Admin page / `POST /api/admin/teams` creates the team and its rows in one transaction.
2. A Postgres trigger (`cyberisland_init_team`, installed at every backend start) creates the rows when a team is inserted with plain SQL, psql, Prisma Studio or a DB GUI. `teams.id` also has a database default now, so `INSERT INTO teams (name, login_name, password_plaintext) VALUES (...)` works.
3. On start the backend backfills rows for any team that is missing them.
4. Login, stage completion and hint requests recreate missing rows for that team on demand.

Deleting a team (admin page, `DELETE /api/admin/teams/:id`, or `DELETE FROM teams WHERE ...`) cascades to its session, progress and hints. Finalized official results keep their own copy of the rows.

After pulling this change run `docker compose up -d --build backend` (or `pnpm prisma db push` on the host) so the new `teams.id` default is applied.

## Inspecting state while playtesting

**Prisma Studio** (live tables: `teams`, `team_progress`, `team_hint_progress`, `contest`):
```bash
pnpm prisma studio     # http://localhost:5555
```
Edits are only written when you press Save. `timestamptz` columns are stored in UTC; if a date cell is a plain text box use ISO 8601 with an offset (e.g. `2026-10-05T14:30:00.000+05:30`), and check the timezone Studio shows against `serverNow` from `/api/contest/status`.

**Admin API** (credentials: `ADMIN_LOGIN_NAME` / `ADMIN_PASSWORD` in `.env`; admin tokens expire, log in again on 401):
```bash
TOKEN=$(curl -s -X POST localhost:3000/api/admin/auth/login -H 'content-type: application/json' \
  -d '{"loginName":"<ADMIN_LOGIN_NAME>","password":"<ADMIN_PASSWORD>"}' | jq -r .accessToken)

watch -n2 "curl -s localhost:3000/api/admin/leaderboard -H 'authorization: Bearer $TOKEN' | jq '.entries[] | {rank,name,completedStages,score,penalty,netScore,sessionActive}'"
curl -s localhost:3000/api/admin/teams/<teamId> -H "authorization: Bearer $TOKEN" | jq
```

**SQL** (e.g. current access codes):
```bash
docker compose exec db psql -U postgres -d cyberisland -c \
  "select name, login_name, password_plaintext, score, penalty from teams order by name;"
```

**Reset between playtests** (dev DB only; wipes all progress, score, hints and puts the contest back to not started):
```bash
docker compose exec db psql -U postgres -d cyberisland -c "
UPDATE team_progress SET stage_1_completed_elapsed=NULL, stage_2_completed_elapsed=NULL, stage_3_completed_elapsed=NULL,
  stage_4_completed_elapsed=NULL, stage_5_completed_elapsed=NULL, stage_6_completed_elapsed=NULL, stage_7_completed_elapsed=NULL,
  stage_8_completed_elapsed=NULL, stage_9_completed_elapsed=NULL, stage_10_completed_elapsed=NULL, stage_11_completed_elapsed=NULL,
  stage_12_completed_elapsed=NULL;
UPDATE team_hint_progress SET hints_used_count=0;
UPDATE teams SET score=0, penalty=0;
UPDATE contest SET status='NOT_STARTED', start_at=NULL, end_at=NULL, results_finalized_at=NULL;"
```

## Starting and controlling the contest

- Start it with `POST /api/admin/contest/start` (sets `status`, `start_at` and `end_at` together), or by setting `status`=`RUNNING`, `start_at`=now and `end_at`=start+duration in Studio.
- **There is no scheduler.** Setting a future `start_at` does nothing; the `status` field is what lets teams play. `RUNNING` with a future `start_at` means the game is live immediately and completions before `start_at` record `0` elapsed seconds.
- A `RUNNING` contest flips to `ENDED` on the next request after `end_at` + grace. To reopen it use `extend-duration`/`set-deadline`, or set `status`=`RUNNING` and a future `end_at`.
- Frontend clients show a "STANDING BY" screen until the contest is `RUNNING` and lock when it ends.

## Notes

- Clock: server clock only. Stage completion stores whole **elapsed seconds since `start_at`**.
- A 2s hidden grace applies to mutations after `end_at`.
- Logging in again as a team instantly invalidates the previous device's tokens.
- Passwords are plaintext by spec; HTTP only, LAN only. Do not expose to the internet.
- Docker build: `pnpm-workspace.yaml` (holds the `allowBuilds` list for prisma/esbuild) must be COPYed before `pnpm install`; the Dockerfile does this.
- Elapsed seconds are clamped to >= 0.
- Postgres is published on `127.0.0.1:5432` only (not on the Wi-Fi/LAN). Host-side `pnpm seed`, Prisma Studio and `docker compose exec db psql` still work; other devices cannot reach the DB. The API itself (`:3000`) is published on all interfaces so teams can reach it.

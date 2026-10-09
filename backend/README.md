# CyberIsland Backend

Authoritative game-state service for *CyberIsland: The Last Signal* (Express + TypeScript + Prisma + PostgreSQL).
Full spec: [`cyberisland-backend-spec.md`](./cyberisland-backend-spec.md). Progress notes: [`CLAUDE.md`](./CLAUDE.md).

## Status (2026-10-05)

- Backend is complete and verified: typecheck, `db push`, seed, integration tests and `docker compose up --build` all run clean.
- The frontend (`../frontend`) is integrated: team login/refresh, contest status, stage completion, hints, progress restore.
- **Admin web page:** `http://<this machine>:3000/admin` (see "Admin page"). Prisma Studio, the admin API and SQL remain available for deeper inspection.
- Contest start is **manual only** (no scheduler, by spec).
- The game has **6 stages** (`TOTAL_STAGES` in `src/utils/progress.ts`). The table still has `stage_7..12` columns; they stay NULL and are never used.
- **Answers are checked by the server.** Teams `POST /api/team/stages/:id/submit {answer}`; the browser never receives answers or locked hint texts. All stage content (scores, accepted answers, hint texts, hint penalties) lives in `src/config/stages.ts`.
- **Nothing is seeded automatically.** After the first start, open `/admin` -> Setup: *Initialize game data*, then *Import teams*.
- Stage scores / hint penalties are placeholders (100 per stage, 5 per hint) and secrets are defaults: change them before the event.

## Quick start (Docker, everything)

> This section is the **developer** compose file (database + backend on :3000). To deploy for the event (database +
> backend + nginx/web on one configurable port) use the root `docker-compose.yml` and follow the root `README.md`.

```bash
docker compose up --build
```

This starts PostgreSQL and the API on `:3000`. On boot the backend only runs `prisma db push` (table structure, no data).
The database starts **empty**: open `http://localhost:3000/admin`, sign in, and in the **Setup** card press *Initialize game data*, then *Import teams* (a JSON file, see below).

## Local dev (API on host, DB in Docker)

```bash
pnpm install
docker compose up -d db
pnpm prisma generate
pnpm prisma db push
pnpm seed           # dev/tests only: same as the admin Setup card, using prisma/teams.json or the sample teams
pnpm dev            # http://localhost:3000/api/health
```

`.env` uses `localhost:5432` for host-side work; compose overrides `DATABASE_URL` to `db:5432` for the container.

## Before the event

1. **Initialize game data** – admin page -> Setup -> *Initialize game data* (or `POST /api/admin/setup/initialize`). Creates the contest record plus the 6 stages with their scores and hint penalties from `src/config/stages.ts`. Safe to repeat, never touches teams/progress, refused while the contest is RUNNING. Until it has been run the API answers `503 CONTEST_MISSING` and the admin page shows a banner.
2. **Teams** – admin page -> Setup -> *Import teams* with a JSON file `[{ "name": "...", "loginName": "...", "password": "..." }]` (max 500). New login IDs are created; existing ones get name + password updated and keep their progress; teams missing from the file are not deleted. You can also add/remove single teams live ("Add team" / team dialog -> "Delete team").
3. **Stage content** – scores, accepted answers, hint texts and hint penalties are in `src/config/stages.ts`. Answers and hint texts are read at request time (rebuild the image to change them); scores and penalties are stored in the DB, so press *Initialize game data* again after editing them (not while the contest is running).
4. **Secrets** – change `JWT_*_SECRET`, `ADMIN_PASSWORD` in `.env`; set `CONTEST_DURATION_MINUTES` (picked up by *Initialize game data* while the contest has not started).
5. Keep your teams file out of git (it holds plaintext access codes). `prisma/teams.json` is git-ignored and excluded from the Docker image; it is only used by the developer CLI `pnpm seed`.

## Scripts

| Script | What |
|---|---|
| `pnpm dev` | tsx watch server |
| `pnpm build` / `pnpm start` | compile to `dist/` / run compiled |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm seed` | developer CLI: initialize game data + import teams (`prisma/teams.json` or the sample teams). Not run by Docker |
| `pnpm test` | integration tests (**wipes progress in the DB in `DATABASE_URL`** – use a scratch DB) |

## API summary

Team: `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/team/me`, `GET /api/team/progress`,
`GET /api/contest/status`, `POST /api/team/stages/:id/submit` (`{ "answer": "..." }`: **200 `{ "correct": true, "progress": {...} }`** when the stage was recorded, **200 `{ "correct": false }`** for a wrong answer (a normal outcome, not an error), 429 after 10 wrong answers in a minute, 409 if it is not the team's next stage, 410/409 outside the contest window), `POST /api/team/stages/:id/hint` (returns `hintText`).
Teams can no longer mark a stage complete themselves; `GET /api/team/progress` includes the text of hints a team has already unlocked, never locked ones or answers.

Admin (Bearer admin token from `POST /api/admin/auth/login`): `GET /api/admin/setup/status`, `POST /api/admin/setup/initialize`, `POST /api/admin/setup/teams` (`{ teams: [...] }`), `POST /api/admin/contest/{start,end,extend-duration,set-deadline}`, `POST /api/admin/contest/reset` (`{ "confirm": "RESET", "durationMinutes"?: n }`; only when ENDED and finalized, otherwise 409; 400 without confirm),
`GET /api/admin/teams`, `POST /api/admin/teams` (`{name, loginName, password}` -> 201, 409 if the login ID exists), `GET /api/admin/teams/:id`, `DELETE /api/admin/teams/:id`, `POST /api/admin/teams/:id/stages/:stageId/complete`,
`PATCH /api/admin/teams/:id/{score,penalty}`, `GET /api/admin/leaderboard`,
`POST /api/admin/results/finalize`, `GET /api/admin/results/csv`.

Errors: `{ "error": { "code", "message" } }` with statuses 400/401/403/404/409/410/422/500.
Extra endpoint: `GET /api/health`.

## Admin page

Open `http://localhost:3000/admin` (or `http://<laptop-ip>:3000/admin` from another device). Sign in with `ADMIN_LOGIN_NAME` / `ADMIN_PASSWORD` from `.env`.

- **Live leaderboard:** rank, team, 6-stage progress bar, score, penalty, net, final-stage time, online dot. Auto-refreshes (3/5/10/30s or manual); changed rows flash. Filter by team or login ID.
- **Contest controls:** start, end now, extend by N minutes, set an absolute deadline, finalize official results (once, after the contest has ended), download the official CSV. Buttons are only enabled when the action is valid for the current state, and destructive ones ask for confirmation.
- **Add team** (button above the table): name, login ID, password (with a Generate button). The team can log in and play immediately.
- **Team details** (click a row): per-stage completion times and hints used, plus overrides: complete the team's next stage, set score, set penalty. **Delete team** (danger zone) removes the team and all its data; you must type its login ID to confirm, and its devices are logged out at once.
- **Setup card:** *Initialize game data* and *Import teams* (JSON file). Replaces the old seed-on-container-start; a banner appears while the game data is missing.
- **Reset & host again** (contest card, enabled only when the contest is ENDED and its results are finalized): type `RESET` to confirm. Clears every team's score, penalty, stage progress and hints, deletes all team sessions (every device must log in again), and returns the contest to NOT STARTED so *Start contest* works again. Teams and previously finalized official snapshots are kept; the official CSV returns 404 until the next finalize. Download the official CSV before resetting.
- **Live CSV export** of the table (clearly separate from the official, frozen result).
- Files live in `backend/admin/` (plain HTML/CSS/JS, no build step, no external resources) and are served by Express at `/admin`; the Dockerfile copies the folder into the image, so rebuild after changing it (`docker compose up -d --build backend`; with `pnpm dev` a browser refresh is enough).
- Security: the page files contain no data. Every call goes to `/api/admin/*` and needs an admin JWT (valid for `JWT_REFRESH_EXPIRES_IN`, default 6h; the page returns to the login screen when it expires). The JWT is kept in `sessionStorage` (cleared when the tab closes). A strict Content-Security-Policy is sent and all API data is rendered with `textContent`. Use a strong `ADMIN_LOGIN_NAME` / `ADMIN_PASSWORD`: anyone who can reach the server can reach the login form (restrict it with `nginx/admin-access.conf`, see the root README). **Only one admin session is active at a time:** an admin login replaces the previous one (table `admin_session`), so the older tab/device is signed out on its next request. Admin credentials are compared in constant time; rate limiting of admin login attempts is done by nginx.

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

# CyberIsland Backend

Authoritative game-state service for *CyberIsland: The Last Signal* (Express + TypeScript + Prisma + PostgreSQL).
Full spec: [`cyberisland-backend-spec.md`](./cyberisland-backend-spec.md). Progress notes: [`CLAUDE.md`](./CLAUDE.md).

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

1. **Teams** – create `prisma/teams.json`: `[{ "name": "...", "loginName": "...", "password": "..." }]`, then `pnpm seed`
   (re-seeding upserts teams and never resets progress/score of existing ones).
2. **Stage scores / hint penalties** – edit `prisma/seed-data.ts`, then `pnpm seed`.
3. **Secrets** – change `JWT_*_SECRET`, `ADMIN_PASSWORD` in `.env`; set `CONTEST_DURATION_MINUTES`.
4. Re-seed in Docker: `docker compose exec backend pnpm seed` (or just restart the backend container).

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
`GET /api/admin/teams`, `GET /api/admin/teams/:id`, `POST /api/admin/teams/:id/stages/:stageId/complete`,
`PATCH /api/admin/teams/:id/{score,penalty}`, `GET /api/admin/leaderboard`,
`POST /api/admin/results/finalize`, `GET /api/admin/results/csv`.

Errors: `{ "error": { "code", "message" } }` with statuses 400/401/403/404/409/410/422/500.
Extra endpoint: `GET /api/health`.

## Notes

- Clock: server clock only. Stage completion stores whole **elapsed seconds since `start_at`**.
- A 2s hidden grace applies to mutations after `end_at`.
- Logging in again as a team instantly invalidates the previous device's tokens.
- Passwords are plaintext by spec; HTTP only, LAN only. Do not expose to the internet.

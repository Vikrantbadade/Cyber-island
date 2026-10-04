# CLAUDE.md — CyberIsland Backend Progress Tracker

> Source of truth: `cyberisland-backend-spec.md` (same dir). Read it first when resuming.
> Update this file after EVERY completed subtopic. Resume from the first unchecked item.
> Last updated: 2026-10-05.

## Stack / decisions
- Express 4 + TypeScript (ESM off, CommonJS output), Prisma 6, PostgreSQL 16, pnpm, zod validation
- Dev runner: `tsx`; tests: `vitest` + `supertest`
- Route handlers thin -> services hold business rules; errors via `HttpError` + central handler
- Async handlers wrapped with `asyncHandler` (Express 4 has no native async error catching)
- Refresh token = JWT with `sid` (session UUID); access token = JWT with `sid` + `sub` (team id) + `role: "team"`
- Admin token = JWT with `role: "admin"`, no DB session
- Default seed values (scores/hints/teams) are PLACEHOLDERS — edit `prisma/seed-data.ts`

## Progress checklist
- [x] 1. Project scaffolding (package.json, tsconfig, .env, .env.example, .gitignore, .dockerignore)
- [x] 2. Prisma schema + seed (schema.prisma, seed-data.ts, seed.ts; optional prisma/teams.json overrides sample teams)
- [x] 3. Core lib/config/utils (config/env, lib/prisma, lib/jwt, lib/errors [HttpError+asyncHandler], utils/time, utils/csv, utils/progress [stage helpers + compareRank], types/auth.types)
- [x] 4. Middleware (teamAuth, adminAuth, notFound [notFoundHandler], errorHandler)
- [x] 5. ContestService (services/contest.service.ts: getContest, getStatus, assertMutationAllowed, startContest, endContest, extendByDuration, setDeadline) + GET /api/contest/status (routes/contest.routes.ts, accepts team OR admin token)
- [x] 6. AuthService + auth routes/controller (team login 201, refresh, admin login 201 at /api/admin/auth/login)
- [x] 7. TeamProgressService (services/team-progress.service.ts: getTeamProfile, getTeamProgress, applyStageCompletion [shared tx core, race-safe via conditional updateMany], completeNextStage, useNextHint) + team.controller/team.routes (/api/team/me, /progress, /stages/:id/complete, /stages/:id/hint)
- [x] 8. AdminTeamService (services/admin-team.service.ts: listTeams, getTeamDetails, manuallyCompleteNextStage, setScore, setPenalty, rankTeams, getLeaderboard) + admin.controller + admin.routes
- [x] 9. Admin contest control endpoints (start/end/extend-duration/set-deadline) in admin.routes/admin.controller
- [x] 10. ResultsService (finalizeOfficialResults, generateOfficialCsv) + results.controller; routes POST /api/admin/results/finalize, GET /api/admin/results/csv
- [x] 11. app.ts / server.ts wiring (cors open, /api/health, listens 0.0.0.0, graceful shutdown)
- [x] 12. Dockerfile (node:22-slim; runtime keeps full node_modules; CMD = prisma db push && seed && node dist/server.js) + docker-compose.yml (db published on 127.0.0.1:5432 only, backend:3000 on all interfaces). The `allowBuilds` list lives in `pnpm-workspace.yaml`, which the Dockerfile must COPY (deps + runtime stages) or pnpm 10+ fails with ERR_PNPM_IGNORED_BUILDS
- [x] 13. Tests written (vitest, sequential, real DB): tests/{helpers,auth,contest,progress,results}.test.ts + vitest.config.ts
- [x] 14. README written
- [x] 15. VERIFY (done 2026-10-05): install, prisma generate, typecheck, db push, seed and `pnpm test` all ran clean; `docker compose up --build` brings up db + API after the Dockerfile fix in step 12

## Frontend integration (done 2026-10-05, lives in `../frontend`)
- Team login (`POST /api/auth/login`), auto refresh on 401, stored session restore, forced re-login when the session is replaced
- Contest gating: waiting / ended screens driven by `GET /api/contest/status`, polled every 10s in-game
- Stage completion: each frontend challenge N calls `POST /api/team/stages/N/complete` (map in `frontend/src/config/env.js` `STAGE_MAP`, currently 1:1 for challenges 1-6, backend stages 7-12 unused)
- Hints: `POST /api/team/stages/:id/hint` (frontend only has text for hint #1 per challenge)
- Progress restore on load from `GET /api/team/progress`
- Open: 6 frontend challenges vs 12 backend stages (decision B, still undecided)

## Known gaps / todo
- No admin web page yet (spec calls for one). Inspect via Prisma Studio, the admin API, or psql — see README.
- Contest start is MANUAL only (no scheduler, by spec). Editing `start_at` in the DB does not start anything; `status` gates play.
- `prisma/teams.json` is baked into the Docker image at build time; to re-seed use the host (`pnpm seed`, DB is exposed on localhost:5432) or rebuild the image.
- Seed scores (100/stage), hint penalties (5/10/20) and sample teams are placeholders.
- Real event secrets (`JWT_*_SECRET`, `ADMIN_PASSWORD`) still need to be changed from defaults.
- No load test yet (target ~100-200 teams on one Wi-Fi).
- No playtest-reset endpoint; use the SQL snippet in the README.

## Open questions / assumptions
- Spec path given as `~/Projects/suraksha/backend/`, actual location is `~/Projects/suraksha/Cyber-island/backend/`.
- ASSUMPTION (flag to user): extend-duration / set-deadline on an ENDED (not finalized) contest REOPENS it to RUNNING. NOT_STARTED -> 409. Finalized -> 409.
- ASSUMPTION: mutation before start -> 409; after end -> 410. Status endpoint reports ENDED as soon as now > end_at (grace hidden).
- ASSUMPTION: hints allowed for any stage <= team's next stage (reached); beyond -> 409. No more configured hints -> 409.
- ASSUMPTION: admin manual complete allowed whenever contest has a start_at (even after ENDED); elapsed = server now - start_at.
- ASSUMPTION: setScore/setPenalty reject negatives/non-integers with 422. finalize only when ENDED, once only. CSV = latest snapshot.
- Ranking ties beyond (net, final elapsed) fall back to team name so rank is unique.
- Elapsed seconds are clamped to >= 0 (a completion before `start_at` records 0).

## Log
- Steps 6-14 written; step 15 verified by the user on 2026-10-05 (everything ran fine).
- 2026-10-05: Dockerfile fixed to COPY pnpm-workspace.yaml (ERR_PNPM_IGNORED_BUILDS under pnpm 12); a later build failure was host DNS, not the Dockerfile.
- 2026-10-05: frontend login/session/stage-sync/hint/timer integration added (see section above); backend code itself unchanged.
- Note: create_directory fails if parent missing; create parents first

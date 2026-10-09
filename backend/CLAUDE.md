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
- [x] 16. Admin web page (2026-10-05): `admin/{index.html,admin.css,admin.js}` served by Express at `/admin` (src/app.ts, strict CSP, no-store; Dockerfile `COPY admin ./admin`). Login, live leaderboard (polling), contest start/end/extend/set-deadline, finalize + official CSV, live CSV export, team detail with manual stage complete / set score / set penalty. Tests: tests/admin-page.test.ts. NOT yet exercised in a browser by the author — playtest it.

- [x] 17. Team create/delete (2026-10-06): teams added directly in the DB had no team_progress/team_hint_progress rows (only seed created them) so stage/hint calls 404'd, and `teams.id` had only a Prisma client-side default so raw SQL inserts failed. Fix: `services/team-integrity.service.ts` (ensureTeamRows lazy heal on login/applyStageCompletion/useNextHint, reconcileTeamRows + installTeamTriggers run at boot from server.ts), `teams.id` -> `dbgenerated("gen_random_uuid()")`, AdminTeamService.createTeam/deleteTeam, `POST /api/admin/teams`, `DELETE /api/admin/teams/:teamId`, admin page Add team modal + Delete team (type login ID to confirm), tests/admin-teams.test.ts. NOT yet run: written without shell access, so run typecheck + `pnpm prisma db push` + `pnpm test` + a browser playtest.

## Frontend integration (done 2026-10-05, lives in `../frontend`)
- Team login (`POST /api/auth/login`), auto refresh on 401, stored session restore, forced re-login when the session is replaced
- Contest gating: waiting / ended screens driven by `GET /api/contest/status`, polled every 10s in-game
- Stage completion: each frontend challenge N calls `POST /api/team/stages/N/complete` (map in `frontend/src/config/env.js` `STAGE_MAP`, currently 1:1 for challenges 1-6, backend stages 7-12 unused)
- Hints: `POST /api/team/stages/:id/hint` (frontend only has text for hint #1 per challenge)
- Progress restore on load from `GET /api/team/progress`
- Open: 6 frontend challenges vs 12 backend stages (decision B, still undecided)

## Known gaps / todo
- Admin page exists (`/admin`) but still needs a real browser playtest; Prisma Studio / admin API / psql remain available — see README.
- Contest start is MANUAL only (no scheduler, by spec). Editing `start_at` in the DB does not start anything; `status` gates play.
- `prisma/teams.json` is baked into the Docker image at build time; to re-seed use the host (`pnpm seed`, DB is exposed on localhost:5432) or rebuild the image.
- Seed scores (100/stage), hint penalties (5/10/20) and sample teams are placeholders.
- Real event secrets (`JWT_*_SECRET`, `ADMIN_PASSWORD`) still need to be changed from defaults.
- No load test yet (target ~100-200 teams on one Wi-Fi).
- Contest reset exists for ENDED + finalized contests only (2026-10-09, see below). The README SQL snippet remains for resetting a contest that was never finalized.

## Open questions / assumptions
- Spec path given as `~/Projects/suraksha/backend/`, actual location is `~/Projects/suraksha/Cyber-island/backend/`.
- ASSUMPTION (flag to user): extend-duration / set-deadline on an ENDED (not finalized) contest REOPENS it to RUNNING. NOT_STARTED -> 409. Finalized -> 409.
- ASSUMPTION: mutation before start -> 409; after end -> 410. Status endpoint reports ENDED as soon as now > end_at (grace hidden).
- ASSUMPTION: hints allowed for any stage <= team's next stage (reached); beyond -> 409. No more configured hints -> 409.
- ASSUMPTION: admin manual complete allowed whenever contest has a start_at (even after ENDED); elapsed = server now - start_at.
- ASSUMPTION: setScore/setPenalty reject negatives/non-integers with 422. finalize only when ENDED, once only. CSV = latest snapshot.
- Ranking ties beyond (net, final elapsed) fall back to team name so rank is unique.
- Elapsed seconds are clamped to >= 0 (a completion before `start_at` records 0).

## 2026-10-08 changes (written without shell access: run `pnpm typecheck`, `pnpm test` and a browser playtest)
- 6 stages: `TOTAL_STAGES = 6` (utils/progress.ts), final stage = stage 6; DB columns stage_7..12 stay NULL; admin page + tests updated.
- Server-side answer verification: `src/config/stages.ts` holds scores, accepted answers, hint texts, hint penalties. New `POST /api/team/stages/:id/submit {answer}` (409 contest/next-stage checks BEFORE the answer so later stages are no oracle; wrong answer = 200 `{correct:false}`, success = 200 `{correct:true, progress}` (changed later the same day from 422 WRONG_ANSWER); 429 after 10 wrong/min via `services/answer-throttle.ts`). Team `/complete` route REMOVED (admin manual complete stays). Hint response has `hintText`; `/team/progress` has `stages[].hints` (unlocked only) and `hintsAvailable`.
- Seeding is manual: `services/seed.service.ts` (getSetupStatus, initializeGameData, importTeams); `GET /api/admin/setup/status`, `POST /api/admin/setup/initialize`, `POST /api/admin/setup/teams`; admin page Setup card. Dockerfile CMD no longer seeds (still `prisma db push`). `pnpm seed` (prisma/seed.ts) is a dev CLI calling the same service. `prisma/teams.json` is git-ignored + docker-ignored. Missing contest row -> 503 CONTEST_MISSING.
- Single admin session (2026-10-08, later): table `admin_session` (singleton id=1, needs `prisma db push` + `prisma generate`), admin JWT carries `sid`, `adminAuth` and the `/contest/status` admin branch verify it via `assertAdminSession` (401 when a newer admin login replaced it). `loginAdmin` is async + constant-time compare. Tests: tests/admin-session.test.ts.
- Deployment (2026-10-08, later): root `docker-compose.yml` (db, backend, web), `.env.example`, `nginx/default.conf` + `nginx/admin-access.conf` (mounted), `frontend/Dockerfile`, root `README.md`. Frontend now calls `/api` (same origin); `frontend/vite.config.js` proxies it in dev. Admin page is reachable through nginx by default; `admin-access.conf` switches between open / allowlist / tunnel-only.
- Image hardening (2026-10-08, later): `packageManager: pnpm@11.3.0` (the version that produced pnpm-lock.yaml; bump it together with the lockfile), `pnpm install --frozen-lockfile`, runtime stage runs as `USER node` with `COPY --chown`, CMD calls `node_modules/.bin/prisma db push` directly (no corepack/network at container start). Per-IP nginx zones for the admin page/API/login (zone `admin`, `adminlogin`); no global lockout by design.
- Tests: helpers `submit/answerFor`, new tests/admin-setup.test.ts; progress/contest/admin-teams tests moved to `/submit`. After pulling, run `pnpm seed` once on the dev DB so surplus hint rows (old 3-per-stage seed) are pruned.

## 2026-10-09 contest reset / host again (written without shell access: run `pnpm typecheck`, `pnpm test` and a browser playtest)
- `contest.service.resetContest`: ENDED + finalized -> NOT_STARTED in one transaction (conditional updateMany claim), clears stage_1..12 elapsed, hints_used_count, score/penalty, deletes all team_sessions, resets the in-memory answer throttle. Optional `durationMinutes`. Teams and old `official_result_snapshots` are kept.
- `POST /api/admin/contest/reset` body `{ confirm: "RESET", durationMinutes? }` (400 on bad body, 409 on wrong state). Admin page: "Reset & host again" button (type RESET).
- `generateOfficialCsv` now returns 404 unless the contest is currently finalized (so a reset hides the previous run's CSV).
- Tests: tests/contest-reset.test.ts.
- Frontend: team devices are forced back to login by the session wipe; QuestSystem state is only rebuilt from server progress on load (GameScene/MainScene not audited for a status-change refresh).

## Log
- Steps 6-14 written; step 15 verified by the user on 2026-10-05 (everything ran fine).
- 2026-10-05: Dockerfile fixed to COPY pnpm-workspace.yaml (ERR_PNPM_IGNORED_BUILDS under pnpm 12); a later build failure was host DNS, not the Dockerfile.
- 2026-10-05: frontend login/session/stage-sync/hint/timer integration added (see section above); backend code itself unchanged.
- 2026-10-05: admin page added (backend/admin, served at /admin) + tests/admin-page.test.ts; app.ts serves static files, Dockerfile copies admin/.
- 2026-10-06: team create/delete + DB-added team fix (step 17). Needs `db push` (new id default) and an image rebuild.
- Note: create_directory fails if parent missing; create parents first

# CLAUDE.md — CyberIsland Backend Progress Tracker

> Source of truth: `cyberisland-backend-spec.md` (same dir). Read it first when resuming.
> Update this file after EVERY completed subtopic. Resume from the first unchecked item.

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
- [x] 5. ContestService (services/contest.service.ts: getContest, getStatus, assertMutationAllowed, startContest, endContest, extendByDuration, setDeadline) + GET /api/contest/status (routes/contest.routes.ts, accepts team OR admin token). Admin HTTP endpoints for start/end/extend/deadline still TODO in step 9.
- [x] 6. AuthService + auth routes/controller (team login 201, refresh, admin login 201 at /api/admin/auth/login)
- [x] 7. TeamProgressService (services/team-progress.service.ts: getTeamProfile, getTeamProgress, applyStageCompletion [shared tx core, race-safe via conditional updateMany], completeNextStage, useNextHint) + team.controller/team.routes (/api/team/me, /progress, /stages/:id/complete, /stages/:id/hint)
- [x] 8. AdminTeamService (services/admin-team.service.ts: listTeams, getTeamDetails, manuallyCompleteNextStage, setScore, setPenalty, rankTeams, getLeaderboard) + admin.controller + admin.routes
- [x] 9. Admin contest control endpoints (start/end/extend-duration/set-deadline) in admin.routes/admin.controller
- [x] 10. ResultsService (finalizeOfficialResults, generateOfficialCsv) + results.controller; routes POST /api/admin/results/finalize, GET /api/admin/results/csv
- [x] 11. app.ts / server.ts wiring (cors open, /api/health, listens 0.0.0.0, graceful shutdown)
- [x] 12. Dockerfile (node:22-slim; runtime keeps full node_modules; CMD = prisma db push && seed && node dist/server.js) + docker-compose.yml (db:5432 exposed to host, backend:3000). package.json has pnpm.onlyBuiltDependencies (required for pnpm 10 build scripts)
- [x] 13. Tests written (vitest, sequential, real DB): tests/{helpers,auth,contest,progress,results}.test.ts + vitest.config.ts. NOT yet run.
- [x] 14. README written
- [ ] 15. VERIFY: user runs install/typecheck/db push/seed/test; fix any errors reported

## User actions pending
- Run: `cd ~/Projects/suraksha/Cyber-island/backend && pnpm install && pnpm prisma generate && pnpm typecheck` and paste any errors.
- Then: `docker compose up -d db && pnpm prisma db push && pnpm seed`, then `pnpm test` (wipes progress in DB!) and `pnpm dev`.

## Open questions / assumptions
- Spec path given as `~/Projects/suraksha/backend/`, actual location is `~/Projects/suraksha/Cyber-island/backend/` (only dir the Filesystem tool can access).

- ASSUMPTION (flag to user): extend-duration / set-deadline on an ENDED (not finalized) contest REOPENS it to RUNNING. NOT_STARTED -> 409. Finalized -> 409.
- ASSUMPTION: mutation before start -> 409; after end -> 410. Status endpoint reports ENDED as soon as now > end_at (grace hidden).
- ASSUMPTION: hints allowed for any stage <= team's next stage (reached); beyond -> 409. No more configured hints -> 409.
- ASSUMPTION: admin manual complete allowed whenever contest has a start_at (even after ENDED); elapsed = server now - start_at.
- ASSUMPTION: setScore/setPenalty reject negatives/non-integers with 422. finalize only when ENDED, once only. CSV = latest snapshot.
- Ranking ties beyond (net, final elapsed) fall back to team name so rank is unique.

## Log
- Steps 6-14 all written (NOT yet compiled/run).
- Empty dirs created: src/{config,lib,utils,middleware,services,controllers,routes,types}, tests/
- Note: create_directory fails if parent missing; create parents first

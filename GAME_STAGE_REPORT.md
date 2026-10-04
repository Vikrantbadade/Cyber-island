# 🏝️ Cyber-Island: The Last Signal — Game Stage Report

**Date**: October 5, 2026
**Project Phase**: `ALPHA — backend verified, frontend playable, frontend↔backend integrated (end-to-end playtesting in progress)`
**Repository Architecture**: Monorepo (`/backend` + `/frontend`)

---

## 1. Executive Summary

**Cyber-Island: The Last Signal** is a 2D retro-style cybersecurity adventure built with **Phaser 3 + Vite** (frontend) and **Express + TypeScript + Prisma + PostgreSQL** (backend). Teams log in, explore the island, talk to NPCs and solve six cybersecurity challenges in the *Aegis mystery* story to rebuild their boat and escape. The backend is the authoritative store for team sessions, sequential stage completion, scoring, hint penalties and the contest clock.

Since the last report (Oct 2): the backend was verified (typecheck, db push, seed, tests, Docker), and the frontend gained team login, session restore, contest gating, a timer/score HUD, backend-recorded stage completion, backend-priced hints and a main-menu logout.

---

## 2. Architecture

```
Cyber-island/
├── (no root package.json / lockfiles: frontend/ and backend/ are independent projects)
├── GAME_STAGE_REPORT.md                   # this file
├── PROMPT_GAME_STAGE_AUDIT.md             # prompt used to regenerate this report
│
├── frontend/                              # Phaser 3 + Vite client
│   ├── index.html                         # UI layer: login, gate, HUD, menu, dialogue, modals
│   ├── .env.example                       # VITE_API_URL, VITE_SKIP_LOGIN (dev only)
│   └── src/
│       ├── scenes/    BootScene, LoginScene, MenuScene, GameScene, MainScene
│       ├── systems/   Dialogue, Interaction, Quest, ChallengeUI, SessionUI
│       ├── services/  api.js (REST + token refresh), session.js (state mirror, polling)
│       ├── entities/  Player, NPC, InteractiveObject
│       ├── config/    env.js (API URL, STAGE_MAP), storyData.js, assetRegistry.js
│       ├── data/      world.js, collision.js, worldObjects.js
│       └── styles/    style.css, session.css
│
└── backend/                               # Express + Prisma REST API
    ├── src/{config,controllers,lib,middleware,routes,services,types,utils}
    ├── prisma/        schema.prisma, seed.ts, seed-data.ts (+ optional teams.json)
    ├── tests/         Vitest integration suites (auth, contest, progress, results)
    ├── Dockerfile, docker-compose.yml     # db (Postgres 16) + API on :3000
    └── CLAUDE.md, README.md, QUICKSTART.md, cyberisland-backend-spec.md
```

---

## 3. Backend Status — ✅ Complete and verified

| Component | Status | Details |
| :--- | :---: | :--- |
| Stack | ✅ | Node 22, Express 4, TypeScript, Prisma 6, PostgreSQL 16, zod, pnpm |
| Auth | ✅ | Team login + refresh JWTs, one active session per team (new login kicks the old device), separate admin login |
| Contest lifecycle | ✅ | `NOT_STARTED → RUNNING → ENDED`, manual start/end, extend/set-deadline, 2s hidden grace; **start is manual only (no scheduler, by spec)** |
| Progress engine | ✅ | Strictly sequential 12-stage completion in one transaction, elapsed seconds since start, race-safe |
| Hints | ✅ | Ordered hints per stage with escalating penalties, usage counts per team |
| Admin API | ✅ | Leaderboard, team list/detail, manual stage complete, score/penalty set, contest control, results finalize + CSV |
| Tests | ✅ | Vitest + supertest integration suites; run clean on 2026-10-05 (they wipe progress in the DB they target) |
| Docker | ✅ | `docker compose up --build` runs db + API (Dockerfile needed `pnpm-workspace.yaml` copied for pnpm build scripts) |

**Endpoints:** `POST /api/auth/login|refresh`, `GET /api/team/me|progress`, `GET /api/contest/status`, `POST /api/team/stages/:id/complete|hint`, `POST /api/admin/auth/login`, `POST /api/admin/contest/{start,end,extend-duration,set-deadline}`, `GET /api/admin/{teams,teams/:id,leaderboard,results/csv}`, `POST /api/admin/teams/:id/stages/:stageId/complete`, `PATCH /api/admin/teams/:id/{score,penalty}`, `POST /api/admin/results/finalize`, `GET /api/health`.

---

## 4. Frontend Status — ✅ Playable and integrated

| Component | Status | Details |
| :--- | :---: | :--- |
| Engine & scenes | ✅ | Phaser 3 arcade physics, 1280x720; Boot → Login → Menu → Main/Game |
| World | ✅ | Island map, collisions (dev collision editor on F3/F4), NPCs, interactive objects |
| Dialogue / interaction / quest HUD | ✅ | Typewriter dialogue, distance-based interaction (`E`/`Space`), island log |
| Login & session | ✅ | Login form, stored-session restore, auto token refresh, forced re-login if session replaced |
| Contest gating | ✅ | Waiting and ended screens, polled every 10s in game; game freezes when not `RUNNING` |
| HUD | ✅ | Team, countdown (red < 5 min), net score, hint penalty, offline indicator |
| Stage sync | ✅ | Completion recorded on backend before the story advances; progress restored on load |
| Hints | 🟡 | Request button calls backend and applies penalty; only hint #1 per challenge has text |
| Logout | ✅ | Main menu / in-game menu, two clicks to confirm |
| Dev bypass | ✅ | `VITE_SKIP_LOGIN=true` (dev server only) plays offline |

---

## 5. Challenges & Progression

The story is the **Aegis mystery** with Dr. Mira Sen: six challenges, in strict order, each earning a boat part; completing all six lets the team escape via the boat.

| # | Challenge | Skill | Backend stage |
| :-: | :--- | :--- | :-: |
| 1 | Decode the Message | Symbol-alphabet decoding | 1 |
| 2 | OSINT Investigation | Photo / metadata inspection | 2 |
| 3 | Dead Network | Network service scan (Nmap-style) | 3 |
| 4 | Abnormal Server | FTP anonymous login | 4 |
| 5 | Keylogger Incident | Log searching (grep-style) | 5 |
| 6 | Suspicious File | Cipher decoding (ROT13) | 6 |

The backend defines **12** stages; stages 7–12 are currently unused (mapping decision pending).

---

## 6. Feature Matrix

| Feature | Done | In progress / partial | Pending |
| :--- | :---: | :---: | :---: |
| Backend API, DB, auth, contest, scoring, results | ✅ | | |
| Backend tests + Docker | ✅ | | |
| Frontend world, dialogue, quests, 6 challenges | ✅ | | |
| Login, session, gating, HUD, stage sync, logout | ✅ | | |
| Hint system | | 🟡 (hint #1 only) | hints 2–3 text |
| 6 challenges ↔ 12 stages | | | ⏳ decision |
| Admin dashboard page | | | ⏳ (use Prisma Studio / API meanwhile) |
| Server-side answer validation | n/a | | (by spec answers are client-side) |
| Load test (100–200 teams) | | | ⏳ |
| Production/LAN hosting of the frontend | | | ⏳ |

---

## 7. Known Issues

1. **Answer bypass:** typing `SCAN` or `NMAP` passes any challenge (`ChallengeUI.verifyTextInput`); completions now hit the backend, so this must go before the event. Several accepted answers are also loose.
2. Boat-parts HUD list (hull/engine/mast/nav/sail) does not match the 6 tracked parts (`ch1`–`ch6`); intro and how-to-play text still mention the old 5-part boat.
3. Possible Phaser key-capture issue in the challenge answer box (unverified).
4. `MenuScene` keydown handler and `GameScene` restart-button handler are added again on each scene start; the restart button only closes the modal.
5. Repo layout: frontend (npm) and backend (pnpm) are deliberately independent projects. Install and run each from its own folder; there are no root package files, lockfiles or workspace config.
6. `prisma/teams.json` is baked into the Docker image at build time (re-seed from the host or rebuild).
7. Seed scores, hint penalties, sample teams and default secrets are placeholders.
8. Challenge 1 depends on an external website (dcode.fr).

---

## 8. Next Steps

1. Remove the `SCAN`/`NMAP` bypass and tighten accepted answers.
2. Decide 6 vs 12 stages (seed 6 stages, or split the story) and update `STAGE_MAP`.
3. Write hints 2–3 per challenge (or reduce configured hints to 1).
4. Fix the boat-parts HUD and stale boat text; fix handler leaks.
5. Build the admin dashboard (live leaderboard, team detail, start/end/extend).
6. Create real `teams.json`, final scores/penalties and event secrets.
7. Document hosting the built frontend on the event LAN.
8. Load-test with ~200 simulated teams.

---

## How to Run

```bash
# Backend (from backend/)
docker compose up --build            # db + API on :3000   (or: docker compose up -d db && pnpm dev)
pnpm seed                            # teams from prisma/teams.json (or 3 sample teams)
pnpm prisma studio                   # inspect data at http://localhost:5555

# Start the contest (game waits on a STANDING BY screen until RUNNING) — see backend README

# Frontend (from frontend/)
npm install && npm run dev           # http://localhost:5173
```

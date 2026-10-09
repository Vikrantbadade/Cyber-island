# CyberIsland: The Last Signal (Frontend)

2D top-down cybersecurity adventure game ("Escape Island"). Teams log in, explore the island, talk to NPCs, solve cyber challenges, collect boat parts and escape. Progress, score and the contest clock are tracked by the backend in `../backend`.

**Stack:** Phaser 3 (game canvas) + Vite + vanilla JS (ES modules). HTML/CSS overlay for login, menus, HUD, dialogue and challenge modals.

## Status (2026-10-05)

| Area | State |
|---|---|
| Game world, movement, collisions, NPCs, dialogue, quest HUD | Working |
| 6 story challenges (Aegis mystery) + victory screen | Working (answers are checked by the backend; the browser has none) |
| Team login / session restore / token refresh | Working, integrated with backend |
| Contest gating (waiting / ended screens) + countdown HUD + score | Working |
| Stage completion recorded on the backend | Working (challenge N -> backend stage N) |
| Hints (backend penalty) | Working: hint text comes from the backend after the team pays (1 hint per challenge configured) |
| Team logout from the main menu | Working (two clicks to confirm) |
| 6 challenges / 6 backend stages | Settled |
| Admin page | Built, but it lives with the backend: `http://<laptop-ip>:3000/admin` (see backend README) |

## Setup

Requires Node.js 18+ (Vite 5).

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build -> dist/
npm run preview    # serve the built dist/ locally
```

The game assets must exist under `public/assets/` (e.g. `public/assets/world/CyberIsland_Base.png`).

## Fonts (one-time step)

The UI uses Pixelify Sans, Press Start 2P and VT323. `src/services/fonts.js` loads them from Google Fonts first and, if that fails or takes more than a few seconds (e.g. no internet on the event Wi-Fi), falls back to a local copy in `public/fonts/` served by the same host as the game. Loading is non-blocking, so text swaps in when the font arrives.

Create the local copy once (needs internet) and commit it:

```bash
cd frontend
npm run fonts        # downloads woff2 files + writes public/fonts/fonts.css
git add public/fonts
```

Until you run it, the fallback has nothing to serve and the UI uses system fonts when offline (the browser console logs which source was used).

## Config (optional, `frontend/.env.local`, see `.env.example`)

| Variable | Meaning |
|---|---|
| `VITE_API_URL` | Backend base URL. Default: `/api` on the same origin as the page (nginx proxies it in production, the vite dev server proxies it in `npm run dev`, see `vite.config.js`). Only set this if the backend is on another origin. |
| `VITE_DEV_API_TARGET` | `npm run dev` only: where the dev server forwards `/api` and `/admin` (default `http://localhost:3000`). |
| `VITE_SKIP_LOGIN=true` | **Dev only** (ignored in production builds). Skips login, timer and server sync; plays fully offline, nothing recorded, hints free. |

## Playtesting with the backend

1. Start the backend (`docker compose up` or `pnpm dev` in `../backend`) and seed teams (see backend README).
2. Start the contest: the game shows a "STANDING BY" screen until the contest is `RUNNING`.
   ```bash
   TOKEN=$(curl -s -X POST localhost:3000/api/admin/auth/login -H 'content-type: application/json' \
     -d '{"loginName":"<ADMIN_LOGIN_NAME>","password":"<ADMIN_PASSWORD>"}' | jq -r .accessToken)
   curl -X POST localhost:3000/api/admin/contest/start -H "authorization: Bearer $TOKEN"
   ```
3. `npm run dev`, log in with a seeded team (sample: `alpha` / `alpha123`).
4. Watch progress in Prisma Studio (`cd ../backend && pnpm prisma studio`) or the admin leaderboard endpoint.

## Game flow

`BootScene` (asset load) -> `LoginScene` -> `MenuScene` -> `MainScene` (extends `GameScene`).

- **LoginScene:** login form over the island backdrop; restores a stored session; holds on a waiting / ended screen until the contest is `RUNNING`.
- **In game:** a top HUD shows team, time left and net score. If the contest ends, an overlay locks the game; if the session is replaced (same team logs in elsewhere) or expires, the player is sent back to login.
- **Challenges:** the typed answer is sent to the backend (`POST /api/team/stages/N/submit`), which checks it and records the completion; the story only advances once the server accepts it. A wrong answer comes back as a normal `200 { correct: false }` (and a 429 throttle after 10 wrong answers per minute). A page refresh restores quests and boat parts from `GET /api/team/progress`.
- **Hints:** hidden until REQUEST HINT is pressed, which calls the backend, deducts the hint penalty and returns the hint text. Hints already bought come back with the progress and stay unlocked. Answers and hint texts live only in the backend (`backend/src/config/stages.ts`).
- **Dev bypass** (`VITE_SKIP_LOGIN=true`, `npm run dev` only): no backend, so any non-empty answer passes and hints show a placeholder.
- **Logout:** main menu (also reachable in-game via the MENU button) -> LOG OUT, click twice to confirm. Not shown in the offline dev bypass.

## Structure

```
index.html              # HTML UI layer (login, gate, HUD, menu, dialogue, challenge/victory modals)
src/main.js             # Phaser config (1280x720, arcade physics), syncs UI layer to canvas
src/styles/style.css    # pixel-art UI styling
src/styles/session.css  # login / gate / HUD / toast / hint styling
src/scenes/             # Boot -> Login -> Menu -> Main/Game scenes
src/entities/           # Player, NPC, InteractiveObject
src/systems/            # Dialogue, Interaction, Quest, ChallengeUI, SessionUI (login/gate/HUD DOM)
src/services/api.js     # REST client: login, refresh-on-401, errors, team/contest/progress/hint calls
src/services/session.js # client mirror of backend state (team, progress, contest clock), polling, events
src/config/             # env.js (API URL, stage map, poll intervals), storyData.js (quests + dialogues)
src/data/               # world.js, collision.js
```

## Controls

`WASD` / arrow keys to move, `E` / `Space` to interact. In dev mode: `F3` toggles collision outlines, `F4` is the collision editor.

## Known issues / TODO

- **Story text still spoils answers:** the success / intro dialogues in `src/config/storyData.js` mention answers (e.g. port 21 and `aegis-vault-07`). Anyone who reads the bundle can learn them. Fixing it properly means serving the success dialogues from the backend after a correct answer.
- Several accepted answers are loose (see `backend/src/config/stages.ts`, e.g. `ECHO` for challenge 6).
- **Only one hint per challenge** is configured; add more in `backend/src/config/stages.ts` (the UI shows a NEXT HINT button when the server offers more).
- **Boat parts HUD:** the list in `index.html` (hull/engine/mast/nav/sail) does not match `QuestSystem` (`ch1`..`ch6`), so only the counter updates, not the individual ticks. Intro and how-to-play text also still mention the old 5-part boat.
- **Listener leaks:** `MenuScene` adds a window `keydown` handler every time it starts, and `GameScene` adds a restart-button click handler every time it starts. The restart button only closes the modal.
- Challenge 1 links to an external site (dcode.fr), which needs internet on the event network.
- Production hosting: see the root `README.md` (`frontend/Dockerfile` builds the game, `nginx/default.conf` serves it and proxies `/api`).

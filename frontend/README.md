# CyberIsland: The Last Signal (Frontend)

2D top-down cybersecurity adventure game ("Escape Island"). Explore the island, talk to NPCs, solve cyber challenges, collect boat parts and escape.

**Stack:** Phaser 3 (game canvas) + Vite + vanilla JS (ES modules). HTML/CSS overlay for menus, HUD, dialogue and challenge modals.

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

No `.env` or extra config needed for the frontend. The game assets must exist under `public/assets/` (e.g. `public/assets/world/CyberIsland_Base.png`).

## Structure

```
index.html          # HTML UI layer (menu, HUD, dialogue, challenge/victory modals)
style.css           # pixel-art UI styling
src/main.js         # Phaser config (1280x720, arcade physics), syncs UI layer to canvas
src/scenes/         # Boot (asset load) -> Menu -> Main/Game scenes
src/entities/       # Player, NPC, InteractiveObject
src/systems/        # Dialogue, Interaction, Quest, ChallengeUI
src/config/         # storyData.js (quests + dialogues)
src/data/           # world.js, collision.js
```

## Controls

`WASD` / arrow keys to move, `E` / `Space` to interact.

## Backend

The contest/scoring API lives in `../backend` (see its README). Start it separately if needed.

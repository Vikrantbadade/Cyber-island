# 🤖 Antigravity AI Prompt: Game Development Stage Audit

> **Usage**: Copy and paste the prompt below into Antigravity (or any AI assistant) whenever you want it to scan the codebase and produce a complete, structured progress and stage report document (`GAME_STAGE_REPORT.md`).

---

### 📋 COPY THE PROMPT BELOW:

```markdown
You are an expert Lead Game Developer & Software Architect auditing the "Cyber-Island: The Last Signal" project.

Please inspect the entire workspace (frontend, backend, database schema, game logic, test suite, configurations, and assets) and produce a detailed, highly structured Markdown report titled `GAME_STAGE_REPORT.md`.

Your report MUST include the following sections:

1. 🎯 Executive Summary & Development Phase (Current stage: e.g. Pre-Alpha, Alpha, Beta, Integration, Launch Ready).
2. 🏗️ Architectural Overview (Monorepo setup, directory layout, separation of concerns).
3. ⚙️ Backend Status Audit:
   - Core Stack & Database (Prisma Schema, PostgreSQL, JWT auth, sessions).
   - API Endpoint Inventory (Auth, Team Progress, Admin, Contest Status, Results).
   - Service Layer & Business Logic completeness.
   - Test Suite status (Vitest / Supertest coverage).
4. 🎮 Frontend Status Audit:
   - Game Engine (Phaser 3 setup, Canvas rendering, UI layer syncing).
   - Scene Management (BootScene, LoginScene, MenuScene, GameScene, MainScene).
   - Core Systems (Interaction System, Dialogue System, Challenge UI Modal, Quest Engine).
   - Backend API Service Integration.
5. 🔐 Cybersecurity Challenges & Game Progression Status:
   - Challenge details: the 6 Aegis-mystery challenges (see `frontend/src/config/storyData.js` and `frontend/src/systems/ChallengeUI.js`) and how they map to backend stages (`STAGE_MAP` in `frontend/src/config/env.js`).
   - Boat Repair Mechanics & Victory Conditions.
6. 📊 Feature Matrix (Completed vs. In-Progress vs. Pending).
7. 🚀 Next Actionable Steps & Developer Roadmap.

After creating `GAME_STAGE_REPORT.md`, provide a concise summary of the key findings in your response.
```

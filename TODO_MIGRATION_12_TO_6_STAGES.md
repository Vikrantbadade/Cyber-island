# Plan: changing the backend from 12 stages to 6

Status: **plan only, nothing has been changed.** Written 2026-10-05.
The frontend already plays 6 challenges (`STAGE_MAP` in `frontend/src/config/env.js` maps challenge N to stage N), so the frontend needs no change.

## Two ways to do it

| | Option 1: logical only (smallest) | Option 2: full schema change |
|---|---|---|
| Idea | Keep the 12 DB columns, just treat only 6 as real | Remove columns `stage_7..12_completed_elapsed` from `team_progress` |
| DB change | None (unused columns stay `NULL`) | Destructive: drops 6 columns |
| Risk | Very low | Medium (needs backup, `--accept-data-loss` if the columns hold data) |
| Downside | Dead columns remain in the schema | One-way unless restored from backup |

Both need the code changes below. Option 2 additionally needs the schema and migration steps.

## What changes (both options)

| File | Change |
|---|---|
| `backend/src/utils/progress.ts` | `TOTAL_STAGES = 6`. `finalStageElapsed` reads `stage12CompletedElapsed`; make it `p?.[stageField(TOTAL_STAGES)]` (or `stage6CompletedElapsed`). Fix the "12" comments. |
| `backend/prisma/seed.ts` | Stage loop `1..12` becomes `1..TOTAL_STAGES`; the `Array.from({ length: 12 })` for `teamHintProgress` becomes 6 (stage 7+ rows would violate the FK once those stages are gone). Add `await prisma.stageMeta.deleteMany({ where: { stageId: { gt: 6 } } })` (cascades to `stage_hints` and `team_hint_progress`), because the seed only upserts and never removes old stage rows. |
| `backend/prisma/seed-data.ts` | `STAGE_SCORES` keys `1..6`. Re-tune scores/hint penalties (max total drops from 12x to 6x the per-stage score). |
| `backend/tests/helpers.ts` | `reset()` builds `stage1..stage12CompletedElapsed` with `length: 12`; make it 6. |
| `backend/tests/*.test.ts` | Anything that completes 12 stages or uses stage 12 (likely `progress.test.ts`, `results.test.ts`). Find with `grep -rn "12" backend/tests`. |
| `backend/admin/admin.js` | `TOTAL_STAGES = 12` becomes 6 (progress bars, "finished" count, detail table). |
| Docs | `cyberisland-backend-spec.md` (12 stages, `team_progress` columns, invariants), `backend/README.md` (reset-SQL lists all 12 columns; with Option 2 it **fails** until trimmed), `GAME_STAGE_REPORT.md`, `backend/CLAUDE.md`. |

Behaviour changes to expect: "final stage" for ranking and "finished" means stage **6** now. Any official results snapshot made earlier used stage 12 (reset the DB first if you have dev snapshots).

## Option 2 only: schema change

In `backend/prisma/schema.prisma`, delete these fields from `model TeamProgress`:

```
stage7CompletedElapsed  ... stage12CompletedElapsed   (6 fields, @map stage_7_..stage_12_completed_elapsed)
```

No other model changes: `StageMeta`, `StageHint`, `TeamHintProgress` keep their shape; only their rows for stages 7..12 go away (via the seed cleanup above).

## Commands

The project uses `prisma db push` (no migration history), and the Docker `CMD` runs `db push --skip-generate && seed` on every start.

### A. Pre-event / throwaway data (simplest, recommended)

Wipes everything in the DB (teams, progress, scores), then rebuilds from the seed:

```bash
cd backend
# 1. make the code + schema edits above, then:
docker compose down -v                 # -v deletes the pgdata volume
docker compose up -d --build           # rebuild image; container runs db push + seed
pnpm prisma generate                   # host types (needed for typecheck/tests)
pnpm typecheck && pnpm test
```

### B. Keep existing data

```bash
cd backend
# 0. backup (plain SQL, restorable)
docker compose exec -T db pg_dump -U postgres --clean --if-exists cyberisland > backup-before-6-stages.sql

# 1. stop writers
docker compose stop backend

# 2. make the code + schema edits above, then apply to the DB from the host (.env points at localhost:5432)
pnpm prisma db push                    # if it refuses with a data-loss warning, re-run with --accept-data-loss
pnpm prisma generate
pnpm seed                              # updates stage scores, deletes stage_meta rows > 6 (cascades)

# 3. verify, then rebuild and start
pnpm typecheck && pnpm test            # NOTE: tests wipe progress in the DB they target
docker compose up -d --build backend
```

`db push` only warns about data loss when a dropped column holds non-null values. Columns 7..12 are normally all `NULL` (the game only completes 1..6), unless someone used the admin "complete stage" override beyond stage 6. The Docker `CMD` does **not** pass `--accept-data-loss`, so do the push from the host first (step 2) as shown.

### Option 1 only (no schema change)

Skip the `schema.prisma` edit and the `db push`. After the code edits run:

```bash
cd backend
pnpm seed                              # deletes stage rows > 6, updates scores
pnpm typecheck && pnpm test
docker compose up -d --build backend
```

## Rollback

```bash
cd backend
git checkout -- .                      # or revert the commit
docker compose stop backend
docker compose exec -T db psql -U postgres -d cyberisland < backup-before-6-stages.sql
docker compose up -d --build backend
```
(Needs the backup from step 0 of plan B; plan A has no rollback because the volume is deleted.)

## Checklist after migrating

- `GET /api/team/progress` returns 6 entries in `stages`, `nextStage` is `null` after stage 6.
- `POST /api/team/stages/7/complete` returns 404.
- `/admin` shows `n/6` progress bars and teams that finish stage 6 count as finished.
- Frontend: finishing challenge 6 records stage 6 and the final-stage time shows in the leaderboard.

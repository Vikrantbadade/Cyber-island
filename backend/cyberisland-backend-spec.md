# CyberIsland: The Last Signal — Backend Specification

## 1. Purpose

A small Express.js service whose sole responsibility is **authoritative game-state tracking** for CyberIsland:

- authenticate one active team session at a time;
- track sequential stage completion;
- record each completed stage as **elapsed seconds since contest start**;
- accumulate stage score and hint penalties;
- expose contest/timer state;
- expose admin monitoring and emergency controls;
- freeze and export final official results as CSV.

The frontend owns the entire story, CTF/challenge implementation, answer validation, hints/content, NPC interactions, evidence, and presentation. The backend never validates challenge answers.

The design document defines CyberIsland as a 12-stage progression ending in `Escape`; the cybersecurity stages include OSINT, Linux/CLI, Nmap, FTP, encoding/crypto, web security, forensics, reverse engineering, integrated investigation, shutdown, and escape. fileciteturn0file0L231-L256

## 2. Fixed Event Model

| Item | Decision |
|---|---|
| Expected scale | ~100–200 teams |
| Deployment | One backend server on Wi-Fi |
| Team representation | One database team record = one logged-in device/session |
| Concurrent team sessions | Exactly one; multiple tabs/devices/logins are not permitted simultaneously |
| Team registration | Pre-created by dev team; participants only log in |
| Participant logout | Not required |
| Admin | Separate admin webpage; one all-powerful admin role |
| API style | REST only; no WebSockets/SSE |
| Backend | Express.js + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Package manager | pnpm |
| Transport | HTTP on common WiFi; no reverse proxy |
| Runtime | Docker container |
| Local orchestration | `docker compose up` |
| Timezone | `Asia/Kolkata` / Mumbai |
| Contest stages | Exactly 12; strictly sequential |
| Stage states | `LOCKED -> AVAILABLE -> COMPLETED` conceptually; backend persists completion only |
| Branching | None |
| Stage reset | Never |
| Stage skip | Never |
| Failed attempts | Backend does not receive or track them; no penalty |
| Challenge answers | Validated entirely client-side |
| Security hardening | Deliberately out of scope beyond JWT authentication/session control |
| Audit/event logs | Not required |
| Backups/migration tracking | Not required |
| Atomic writes | Every mutating operation commits atomically to PostgreSQL |

The narrative/game document explicitly treats challenges as connected progression rather than detached quiz questions and defines 12 recommended progression stages. fileciteturn0file0L179-L223 fileciteturn0file0L231-L256

## 3. Scoring and Progress Rules

### 3.1 Stage completion

A team can complete **only its immediate next stage**.

For a team whose highest completed stage is `N`:

- stages `1..N` are completed;
- stage `N+1` is the next valid stage;
- stages `N+2..12` remain locked from the backend's progression model.

Completion is one-way and one-time.

On valid completion of stage `S`:

1. verify authenticated team;
2. verify contest accepts mutations;
3. verify `S` is exactly the next sequential stage;
4. read stage score from `stage_meta`;
5. calculate `elapsed_seconds = server_now - contest.start_at`;
6. store that elapsed value in the stage's completion column;
7. add the configured stage score to `team.score`;
8. commit everything in **one database transaction**.

The client may decide when to show/access the next stage, but the backend remains authoritative for recorded completion and scoring.

### 3.2 Hints

Each stage can have multiple ordered hints. Later hints are progressively more obvious and have progressively higher penalties. Hint configuration is manual database data.

The client sends only the **stage number** when requesting a hint.

The backend:

1. finds the team's current number of hints already used for that stage;
2. selects the next configured hint by `hint_order`;
3. applies that hint's penalty to `team.penalty`;
4. increments the team's hint-use count for the stage;
5. commits the update atomically.

The backend stores hint usage counts, not challenge/hint content.

### 3.3 Ranking

Primary ordering:

```text
net_score = score - penalty
```

Higher `net_score` ranks first.

Tiebreaker:

```text
final_stage_elapsed_seconds
```

Lower final-stage elapsed time ranks first.

The timestamp used is the **stage 12 completion elapsed time**, measured from contest start. Teams that never complete stage 12 have no final-stage completion time and therefore are treated as incomplete for that field; their achieved score/penalty still count normally.

For general display, cumulative stage history is available, but ranking uses the **final stage timestamp only**, not a sum of stage completion deltas.

## 4. Contest Lifecycle

Contest status:

```text
NOT_STARTED -> RUNNING -> ENDED
```

Rules:

- start is always a **manual admin action**;
- there is exactly one global `start_at`;
- initial duration is configured as `N` minutes;
- contest deadline is derived from `start_at + duration`;
- admin can extend the contest;
- admin can extend by an additional duration and/or set an absolute new deadline;
- admin can end the contest early;
- contest cannot be paused;
- there is no scheduled automatic start;
- server clock is authoritative;
- timezone/display is `Asia/Kolkata`;
- after the deadline, stage-completion and hint-use requests are rejected;
- a hidden 2-second grace window is accepted for in-flight requests immediately around the deadline;
- exact implementation rule: a mutating request is accepted only while `server_now <= end_at + 2 seconds` and the contest is still `RUNNING`;
- after contest end, no new game-state mutations are accepted;
- incomplete stages simply remain incomplete and their points are not awarded.

## 5. Authentication / Session Model

### Team authentication

JWT + refresh token.

Login returns:

```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

Teams remain logged in for the event. The frontend refreshes the access token automatically; no re-login is required during an expected multi-hour event.

Only one active team session exists at a time. Recommended implementation:

- `team_sessions.team_id` is unique;
- login replaces the team's existing session record;
- JWTs contain the session UUID;
- authenticated requests require the token's session UUID to match the team's current session;
- a new login therefore invalidates the previous session without requiring logout logic.

No password hashing is required. The team password is stored in plaintext as specified.

### Admin authentication

Separate endpoint and separate admin webpage. One admin role only. Admin credentials are configuration/env data; admin JWTs carry an `admin` role/subject.

## 6. Database Schema

PostgreSQL is the authoritative state store.

### 6.1 `teams`

Required business fields:

```text
id                  UUID PK
name                TEXT
login_name          TEXT UNIQUE
password_plaintext  TEXT
score               INTEGER
penalty             INTEGER
```

Implementation-support field:

```text
created_at           TIMESTAMPTZ
```

`score` and `penalty` are stored totals, not derived at read time.

### 6.2 `team_sessions`

Supports exactly one active login/session per team:

```text
id                  UUID PK
team_id             UUID UNIQUE FK -> teams.id
created_at          TIMESTAMPTZ
expires_at          TIMESTAMPTZ
```

### 6.3 `stage_meta`

Exactly 12 rows, one for each stage:

```text
stage_id             SMALLINT PK       -- 1..12
stage_score          INTEGER NOT NULL
```

The originally described single `stage_hint_penalty` field is superseded by the final requirement that each stage has **multiple individually configured hints with different penalties**; those penalties therefore belong in `stage_hints`.

### 6.4 `stage_hints`

No story/content is stored here; only configuration needed by the backend:

```text
id                   UUID PK
stage_id             SMALLINT FK -> stage_meta.stage_id
hint_order           SMALLINT         -- 1,2,3,...
penalty              INTEGER NOT NULL
```

Unique constraint:

```text
(stage_id, hint_order)
```

### 6.5 `team_progress`

One row per team; exactly 12 nullable completion fields.

```text
team_id                      UUID PK/FK -> teams.id
stage_1_completed_elapsed    INTEGER NULL
stage_2_completed_elapsed    INTEGER NULL
stage_3_completed_elapsed    INTEGER NULL
stage_4_completed_elapsed    INTEGER NULL
stage_5_completed_elapsed    INTEGER NULL
stage_6_completed_elapsed    INTEGER NULL
stage_7_completed_elapsed    INTEGER NULL
stage_8_completed_elapsed    INTEGER NULL
stage_9_completed_elapsed    INTEGER NULL
stage_10_completed_elapsed   INTEGER NULL
stage_11_completed_elapsed   INTEGER NULL
stage_12_completed_elapsed   INTEGER NULL
```

Values are **elapsed whole seconds from contest start**, not absolute timestamps and not per-stage duration.

A `NULL` value means the stage has not been completed.

### 6.6 `team_hint_progress`

Minimal backend state needed to report and enforce ordered hint usage:

```text
team_id                    UUID FK -> teams.id
stage_id                   SMALLINT FK -> stage_meta.stage_id
hints_used_count           SMALLINT NOT NULL DEFAULT 0
```

Primary key:

```text
(team_id, stage_id)
```

No hint text is stored.

### 6.7 `contest`

Single-row event configuration/state:

```text
id                         SMALLINT PK       -- fixed value 1
status                     ENUM
start_at                   TIMESTAMPTZ NULL
end_at                     TIMESTAMPTZ NULL
duration_minutes           INTEGER NOT NULL
timezone                   TEXT NOT NULL     -- Asia/Kolkata
grace_seconds              INTEGER NOT NULL DEFAULT 2
results_finalized_at       TIMESTAMPTZ NULL
```

Contest enum:

```text
NOT_STARTED
RUNNING
ENDED
```

### 6.8 `official_result_snapshots`

Frozen results are stored separately from mutable live team state:

```text
id                         UUID PK
created_at                 TIMESTAMPTZ
contest_id                 SMALLINT FK -> contest.id
```

### 6.9 `official_result_rows`

Immutable rows belonging to the finalized snapshot:

```text
snapshot_id                UUID FK -> official_result_snapshots.id
rank                       INTEGER
team_id                    UUID
team_name                  TEXT
score                      INTEGER
penalty                    INTEGER
net_score                  INTEGER
final_stage_elapsed        INTEGER NULL
```

The snapshot contains the leaderboard values exactly as they existed at finalization time, so later admin changes cannot modify official results.

## 7. Prisma Model Shape

Illustrative Prisma structure:

```prisma
enum ContestStatus {
  NOT_STARTED
  RUNNING
  ENDED
}

model Team {
  id               String            @id @default(uuid()) @db.Uuid
  name             String
  loginName        String            @unique
  passwordPlaintext String
  score            Int               @default(0)
  penalty          Int               @default(0)
  createdAt        DateTime          @default(now())

  session          TeamSession?
  progress         TeamProgress?
  hintProgress     TeamHintProgress[]
}

model TeamSession {
  id               String   @id @default(uuid()) @db.Uuid
  teamId           String   @unique @db.Uuid
  createdAt        DateTime @default(now())
  expiresAt        DateTime

  team             Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
}

model StageMeta {
  stageId          Int          @id
  stageScore       Int
  hints            StageHint[]
}

model StageHint {
  id               String       @id @default(uuid()) @db.Uuid
  stageId          Int
  hintOrder        Int
  penalty          Int

  stage            StageMeta    @relation(fields: [stageId], references: [stageId], onDelete: Cascade)
  @@unique([stageId, hintOrder])
}

model TeamProgress {
  teamId                    String @id @db.Uuid
  stage1CompletedElapsed    Int?
  stage2CompletedElapsed    Int?
  stage3CompletedElapsed    Int?
  stage4CompletedElapsed    Int?
  stage5CompletedElapsed    Int?
  stage6CompletedElapsed    Int?
  stage7CompletedElapsed    Int?
  stage8CompletedElapsed     Int?
  stage9CompletedElapsed    Int?
  stage10CompletedElapsed   Int?
  stage11CompletedElapsed   Int?
  stage12CompletedElapsed   Int?

  team                      Team   @relation(fields: [teamId], references: [id], onDelete: Cascade)
}

model TeamHintProgress {
  teamId          String @db.Uuid
  stageId         Int
  hintsUsedCount  Int    @default(0)

  team            Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  @@id([teamId, stageId])
}

model Contest {
  id                  Int           @id
  status              ContestStatus @default(NOT_STARTED)
  startAt             DateTime?
  endAt               DateTime?
  durationMinutes     Int
  timezone            String        @default("Asia/Kolkata")
  graceSeconds        Int           @default(2)
  resultsFinalizedAt  DateTime?
}

model OfficialResultSnapshot {
  id          String               @id @default(uuid()) @db.Uuid
  createdAt   DateTime             @default(now())
  contestId   Int
  rows        OfficialResultRow[]
}

model OfficialResultRow {
  snapshotId              String @db.Uuid
  rank                    Int
  teamId                  String @db.Uuid
  teamName                String
  score                   Int
  penalty                 Int
  netScore                Int
  finalStageElapsed       Int?

  snapshot OfficialResultSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  @@id([snapshotId, rank])
}
```

## 8. REST API Surface

Base path:

```text
/api
```

All authenticated team endpoints receive:

```http
Authorization: Bearer <accessToken>
```

### 8.1 Team auth

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Team login; creates/replaces sole active session; returns access + refresh tokens |
| `POST` | `/api/auth/refresh` | Exchange refresh token for a new access token |

### 8.2 Team read APIs

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/team/me` | Own team profile: id, name, login name, score, penalty |
| `GET` | `/api/team/progress` | Completed stages, next stage, per-stage elapsed values, hint-use counts |
| `GET` | `/api/contest/status` | Contest status, start/end time, configured duration, server-derived remaining seconds |

Suggested `GET /api/team/progress` response:

```json
{
  "teamId": "uuid",
  "score": 450,
  "penalty": 20,
  "netScore": 430,
  "completedStages": [1, 2, 3],
  "nextStage": 4,
  "stages": [
    { "stageId": 1, "completedElapsedSeconds": 18, "hintsUsed": 0 },
    { "stageId": 2, "completedElapsedSeconds": 47, "hintsUsed": 1 },
    { "stageId": 3, "completedElapsedSeconds": 91, "hintsUsed": 2 }
  ]
}
```

### 8.3 Team mutating APIs

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| `POST` | `/api/team/stages/:stageId/complete` | none | Report completion of the immediate next stage |
| `POST` | `/api/team/stages/:stageId/hint` | none | Request/use the next configured hint for that stage; applies backend-known penalty |

Completion endpoint behavior:

- authenticated team only;
- contest must be `RUNNING` and inside deadline + 2-second grace;
- `stageId` must equal the team's immediate next stage;
- stage must not already be completed;
- score read from DB;
- elapsed time calculated on server;
- stage progress + score committed in one transaction.

Hint endpoint behavior:

- authenticated team only;
- contest must be `RUNNING` and inside deadline + 2-second grace;
- `stageId` must be a stage the team has reached/currently can use according to the frontend/game flow;
- backend determines which ordered hint is next from `hints_used_count`;
- penalty read from DB;
- hint-use count + team penalty committed atomically.

No API exists for submitting challenge answers, failed attempts, or story content.

## 9. Admin REST APIs

Admin authentication is separate from team authentication.

### 9.1 Admin auth

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Admin login |
|
### 9.2 Contest control

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| `POST` | `/api/admin/contest/start` | none | Set contest `NOT_STARTED -> RUNNING`, set authoritative `start_at` and initial `end_at` |
| `POST` | `/api/admin/contest/end` | none | End contest immediately |
| `POST` | `/api/admin/contest/extend-duration` | `{ "additionalMinutes": N }` | Add time to current deadline |
| `POST` | `/api/admin/contest/set-deadline` | `{ "endAt": "ISO-8601" }` | Replace deadline with an absolute timestamp |
| `POST` | `/api/admin/results/finalize` | none | Freeze the official leaderboard snapshot; allowed only after contest is `ENDED` |
| `GET` | `/api/admin/results/csv` | none | Download CSV from the frozen official snapshot |

### 9.3 Admin team operations

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/teams` | query params | Search/filter/sort live teams |
| `GET` | `/api/admin/teams/:teamId` | — | Detailed team inspection/timeline |
| `POST` | `/api/admin/teams/:teamId/stages/:stageId/complete` | none | Manually complete only the team's immediate next stage; timestamp = admin action server time |
| `PATCH` | `/api/admin/teams/:teamId/score` | `{ "score": N }` | Set team's score |
| `PATCH` | `/api/admin/teams/:teamId/penalty` | `{ "penalty": N }` | Set team's penalty |
| `GET` | `/api/admin/leaderboard` | query params | Live leaderboard via ordinary REST |

Admin manual stage completion never permits jumping ahead or skipping stages.

### 9.4 Admin team filtering/sorting

`GET /api/admin/teams` supports:

```text
q=<team name substring>
completedStages=<0..12>
sortBy=name|completedStages|score|penalty
order=asc|desc
page=<n>
pageSize=<n>
```

Leaderboard sorting is:

```text
netScore DESC
finalStageElapsed ASC (for tied net scores)
```

The detailed team response should include all 12 stage completion fields plus hint-use counts, score, penalty, net score, next stage, and derived current status.

## 10. Response Semantics / HTTP Statuses

Suggested minimal statuses:

```text
200  successful reads/updates
201  successful login/session creation where appropriate
400  malformed request
401  missing/invalid/expired JWT or refresh token
403  authenticated but wrong role / forbidden admin operation
404  unknown team/stage
409  invalid progression state (wrong next stage, already completed, etc.)
410  contest ended / mutation window closed
422  invalid business value (e.g. negative score/penalty when disallowed)
500  unexpected server/database error
```

All state-changing operations should be implemented with Prisma transactions where more than one row/field must change together.

## 11. Derived Backend State

The backend does **not** persist `AVAILABLE` flags per stage.

Derived values:

```text
completedStageCount = highest non-null completion stage
nextStage            = completedStageCount + 1, unless all 12 are complete
currentStage         = nextStage when contest is running; otherwise presentation-specific
netScore              = score - penalty
remainingSeconds      = max(0, floor((end_at + grace/end policy - server_now) ...))
```

The frontend is responsible for showing/locking narrative/challenge content. The backend only records whether a stage has been completed and the resulting score/timing state.

## 12. Server Clock / Time Utilities

All authoritative game calculations must use the server process clock.

Recommended utilities:

```text
getNow()
getContestElapsedSeconds(startAt, now)
getContestDeadline(contest)
isMutationAllowed(contest, now)
getRemainingSeconds(contest, now)
```

Store contest absolute timestamps as PostgreSQL `timestamptz`. Store stage completion values as integer elapsed seconds.

## 13. Recommended Service Boundaries

Keep route handlers thin; business rules live in services.

```text
AuthService
  loginTeam()
  refreshTeamAccessToken()
  loginAdmin()

ContestService
  getStatus()
  startContest()
  endContest()
  extendByDuration()
  setDeadline()
  assertMutationAllowed()

TeamProgressService
  getTeamProfile()
  getTeamProgress()
  completeNextStage()
  useNextHint()

AdminTeamService
  listTeams()
  getTeamDetails()
  manuallyCompleteNextStage()
  setScore()
  setPenalty()
  getLeaderboard()

ResultsService
  finalizeOfficialResults()
  generateOfficialCsv()
```

## 14. Project File Structure

```text
cyberisland-backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   └── env.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── jwt.ts
│   ├── middleware/
│   │   ├── teamAuth.ts
│   │   ├── adminAuth.ts
│   │   ├── notFound.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── team.routes.ts
│   │   ├── contest.routes.ts
│   │   └── admin.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── team.controller.ts
│   │   ├── contest.controller.ts
│   │   ├── admin.controller.ts
│   │   └── results.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── contest.service.ts
│   │   ├── team-progress.service.ts
│   │   ├── admin-team.service.ts
│   │   └── results.service.ts
│   ├── utils/
│   │   ├── time.ts
│   │   └── csv.ts
│   └── types/
│       └── auth.types.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   ├── auth.test.ts
│   ├── contest.test.ts
│   ├── progress.test.ts
│   └── results.test.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── .dockerignore
├── .env
├── .env.example
└── README.md
```

## 15. Runtime Request Flow

### Team login

```text
Browser
  -> POST /api/auth/login
  -> verify login_name + plaintext password
  -> replace/create team_sessions row
  -> issue access JWT + refresh JWT
  -> Browser stores tokens
```

### Automatic token refresh

```text
Browser
  -> access JWT expires
  -> POST /api/auth/refresh with refresh JWT
  -> validate current team session
  -> issue fresh access JWT
```

### Stage completion

```text
Browser challenge says "solved"
  -> POST /api/team/stages/:stageId/complete
  -> JWT/session check
  -> contest deadline check
  -> sequential-stage check
  -> read stage score
  -> calculate elapsed seconds from contest start
  -> update team_progress + team.score in one transaction
  -> return updated progress
```

### Hint use

```text
Browser requests next hint for stage S
  -> POST /api/team/stages/S/hint
  -> JWT/session check
  -> contest deadline check
  -> find next hint by hint_order
  -> add DB-configured penalty
  -> increment hints_used_count
  -> commit atomically
  -> return updated team penalty + hints used
```

## 16. Admin Dashboard Data Contract

Dashboard page loads through normal REST requests.

Primary calls:

```text
GET /api/contest/status
GET /api/admin/leaderboard
GET /api/admin/teams?...
```

Team inspection:

```text
GET /api/admin/teams/:teamId
```

The admin UI displays:

```text
Team name
Current/highest completed stage
Score
Penalty
Net score
Final-stage elapsed time, if complete
Global contest status
Global remaining time
```

No real-time socket transport is required; the admin page can refresh/poll REST endpoints at a reasonable interval.

## 17. Official Result Finalization

Finalization is an explicit admin operation.

Precondition:

```text
contest.status == ENDED
```

On finalization, the backend:

1. reads all teams;
2. computes `net_score = score - penalty`;
3. ranks by `net_score DESC`, then `stage_12_completed_elapsed ASC` for ties;
4. creates one immutable `official_result_snapshots` record;
5. creates immutable snapshot rows for the ordered leaderboard;
6. marks `contest.results_finalized_at`;
7. generates/downloads CSV from that frozen snapshot.

The CSV should minimally contain:

```text
rank,team_id,team_name,score,penalty,net_score,final_stage_elapsed_seconds
```

The source `teams` table can still be modified by an admin before/afterwards; official results remain frozen because they are copied into the snapshot tables.

## 18. Environment Configuration

`.env.example`:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@db:5432/cyberisland

JWT_ACCESS_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=6h

ADMIN_LOGIN_NAME=admin
ADMIN_PASSWORD=replace-me

CONTEST_TIMEZONE=Asia/Kolkata
CONTEST_DURATION_MINUTES=180
CONTEST_GRACE_SECONDS=2
```

The contest duration remains configurable even though the backend supports exactly 12 stages.

## 19. Docker

### `Dockerfile`

Use a Node LTS image with pnpm enabled; build TypeScript and run the compiled Express server.

Conceptual stages:

```text
base -> dependencies -> build -> runtime
```

### `docker-compose.yml`

Default stack:

```text
postgres service
  - persistent named volume
  - internal port 5432

backend service
  - waits for postgres
  - runs Prisma schema setup / seed as appropriate
  - exposes port 3000 on the LAN/WiFi
```

Example service topology:

```text
LAN clients (100–200 teams)
        |
        v
  cyberisland-api :3000
        |
        v
 PostgreSQL :5432
```

A host-installed PostgreSQL can also be used by changing `DATABASE_URL`; the default compose setup should remain self-contained so `docker compose up` starts the complete stack.

## 20. Seed Data

`prisma/seed.ts` should create/configure:

- the single contest row;
- exactly 12 `stage_meta` rows;
- all stage hint definitions and penalties;
- all pre-created team records;
- initial `team_progress` rows;
- initial `team_hint_progress` state as needed.

No challenge/story data is seeded because that content lives in the frontend.

## 21. Deliberately Out of Scope

Not implemented in this backend:

- CTF answer validation;
- challenge execution;
- challenge containers/VM orchestration;
- OSINT/forensics/Nmap/FTP/etc. challenge logic;
- story/NPC/evidence systems;
- failed-answer tracking;
- attempt penalties;
- WebSockets/SSE;
- pause/resume;
- branching progression;
- stage reset/skip;
- participant logout;
- multi-session team support;
- sophisticated anti-tampering/anti-cheating systems;
- audit logs;
- automated backups;
- migration-history tooling;
- production reverse proxy/HTTPS stack;
- participant-facing leaderboard unless added later.

## 22. Implementation Priorities

1. PostgreSQL schema + seed data.
2. Contest state/timing service.
3. JWT/session authentication.
4. Sequential stage completion transaction.
5. Ordered hint-use + penalty transaction.
6. Team read APIs.
7. Admin team/leaderboard APIs.
8. Contest control APIs.
9. Official result snapshot + CSV.
10. Docker/Compose packaging.
11. Minimal integration tests around timing, progression, scoring, hints, admin overrides, and finalization.

## 23. Canonical Invariants

These are the backend rules that must never be violated:

```text
1. Exactly 12 stages exist.
2. A team can complete only its immediate next stage.
3. A stage can be completed only once.
4. Completion order is strictly 1 -> 2 -> ... -> 12.
5. Stage score comes from stage_meta, never from the client.
6. Hint penalty comes from stage_hints, never from the client.
7. Completion elapsed time comes from server_now - contest.start_at.
8. Score/penalty/progress mutations are atomic database operations.
9. Team requests require a currently valid team JWT/session.
10. Only one active team session exists per team.
11. Contest mutations are rejected after end_at + 2 seconds.
12. Admin manual completion still cannot skip stages.
13. Official results are copied into an immutable snapshot before CSV export.
14. Final ranking uses net score first, final-stage elapsed time second.
```

# CyberIsland: The Last Signal

A 2D cybersecurity adventure for a coding contest. Teams on the college network play in the browser; the backend on one
server keeps the clock, checks answers and scores.

```
students ──► http://<server>:WEB_PORT ──► web (nginx: game files + /api proxy) ──► backend ──► PostgreSQL
organizers ─► http://<server>:WEB_PORT/admin  (or an SSH tunnel, see "Admin access")
```

Short, command-only version for Linux and Windows: **[QUICKSTART.md](QUICKSTART.md)**.

| Folder | What |
|---|---|
| `frontend/` | the game (Phaser + Vite). Built into the `web` container |
| `backend/` | API + admin page (Express, Prisma, PostgreSQL). See `backend/README.md` |
| `nginx/` | `default.conf` (proxy, rate limits) and `admin-access.conf` (who may reach the admin page) |
| `docker-compose.yml` | the whole deployment: `db`, `backend`, `web` |

## Quickstart (on the server)

Needs Docker with the Compose plugin (`docker compose version`). Nothing else is assumed about the machine.

```bash
git clone <repo> && cd Cyber-island
cp .env.example .env
nano .env                      # fill in the secrets, admin login and (optionally) the port, see below
docker compose up -d --build
docker compose ps              # db, backend and web should be "running" / "healthy"
```

The first build takes a few minutes. Then check it works from the server itself (use your `WEB_PORT`):

```bash
curl http://localhost:80/api/health        # {"ok":true}
```

Open `http://<server address>:<WEB_PORT>/` from another machine on the network to see the login screen. The database
starts **empty**: do the first-time setup below before the event.

### Setting the port

The game, the API and the admin page all share **one** port, set by `WEB_PORT` in `.env`:

```
WEB_PORT=8080
```

Students then use `http://<server address>:8080`. Apply a change with `docker compose up -d` (no rebuild needed: the game
talks to `/api` on whatever address it was loaded from, so it never needs to know the port).

- Default is `80`, which needs no port in the URL. Use any free port if 80 is taken or IT gave you one.
- "port is already allocated" / "address already in use" on startup means something else uses it. See what with
  `ss -ltnp | grep :80` and pick another `WEB_PORT`.
- `WEB_BIND` limits which network address it listens on (default `0.0.0.0`, all interfaces).
- The server's firewall (and any college firewall) must allow the chosen port. Ask IT to open it for the student network.
- `BACKEND_LOCAL_PORT` (default 3000) is only bound to `127.0.0.1` for the admin tunnel. It is not reachable from the
  network. Change it if something on the server already uses 3000.

### First-time setup (once)

1. Open `http://<server address>:<WEB_PORT>/admin` and sign in with `ADMIN_LOGIN_NAME` / `ADMIN_PASSWORD` from `.env`.
2. **Setup** card: press **Initialize game data** (creates the contest record, the 6 stages, scores and hints).
3. **Setup** card: **Import teams** with a JSON file: `[{ "name": "Team A", "loginName": "team-a", "password": "..." }, ...]`
   (max 500 per file; you can also add or delete single teams later). Keep that file out of git.
4. Do a dry run with two test teams, then reset (see `backend/README.md`, "Reset between playtests") and start the real
   contest from the admin page when you are ready.

## Admin access

The admin page has its own strong login (`ADMIN_LOGIN_NAME` / `ADMIN_PASSWORD`), only **one admin session is active at a
time** (signing in anywhere signs out the previous session). The admin page, the admin API and the admin login are rate limited **per client IP** (never globally), so an address that floods them is throttled on its own and cannot lock the real admin out. Who may reach it
through the public port is controlled by `nginx/admin-access.conf`; edit it and run `docker compose restart web`:

| Mode | How |
|---|---|
| **1. Open** (default) | leave the file as is. Anyone who can reach the server can see the admin login form |
| **2. Allowlist** | uncomment the `allow ...;` lines and `deny all;` with the admin machine's IP or subnet |
| **3. Tunnel only** | uncomment `return 403;`, then use an SSH tunnel: |

```bash
ssh -L 8081:127.0.0.1:3000 <user>@<server>      # 3000 = BACKEND_LOCAL_PORT
# then open http://localhost:8081/admin on your own machine
```

The tunnel works in every mode, so you can switch modes freely once IT tells you what is possible.

## Day-to-day commands

```bash
docker compose logs -f backend       # backend log (also: web, db)
docker compose restart web           # after editing nginx/*.conf
docker compose up -d                 # after editing .env (recreates only what changed)
git pull && docker compose up -d --build     # deploy a new version (data is kept)
docker compose down                  # stop (data is kept)
docker compose down -v               # stop AND DELETE the database. Only for a full reset
```

**Backups.** Take one before the contest and keep one running during it:

```bash
mkdir -p backups
docker compose exec -T db pg_dump -U cyber cyberisland | gzip > backups/cyberisland-$(date +%Y%m%d-%H%M%S).sql.gz

# every 5 minutes while the contest runs (leave in a tmux/screen window)
while true; do docker compose exec -T db pg_dump -U cyber cyberisland | gzip > backups/cyberisland-$(date +%H%M%S).sql.gz; sleep 300; done

# restore into an empty database (after: docker compose down -v && docker compose up -d db)
gunzip -c backups/<file>.sql.gz | docker compose exec -T db psql -U cyber cyberisland
```

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `docker compose up` stops with "set DB_PASSWORD in .env" (or similar) | a required value in `.env` is empty |
| Students see "SERVER UNREACHABLE" / the admin page says 503 `CONTEST_MISSING` | game data not initialized yet: admin page -> Setup -> Initialize |
| Page loads but login says connection problem | `docker compose ps`: is `backend` healthy? `docker compose logs backend` |
| Admin page says "signed out" | someone else (or another tab) signed in as admin, or the 6 h session expired |
| `429` errors | nginx rate limit: raise it in `nginx/default.conf` (all of a lab may share one IP address) |
| Everybody gets `429` together, or `docker compose logs web` shows the same `172.x.x.1` address for every request | nginx does not see real client IPs, so the per-IP limits act as one shared bucket. Check the log lines; behind a college proxy set `set_real_ip_from` / `real_ip_header` in `nginx/default.conf` (commented block near the top) |
| The admin is throttled (429) while testing from the same machine as a flood | per-IP limit working as intended; if the admin and an attacker share one NAT address use mode 2 or 3 of the admin access table |
| Works on the server, not from other machines | firewall, wrong `WEB_BIND`, or Wi-Fi client isolation on the network |

## Development

`backend/` and `frontend/` have their own READMEs. In short: `docker compose up -d db` inside `backend/` (its own
dev compose file), then `pnpm dev` in `backend/` and `npm run dev` in `frontend/` (its dev server proxies `/api` and
`/admin` to `localhost:3000`).

# QUICKSTART: host and test CyberIsland

Production = one machine running Docker. Students open `http://<server>:<WEB_PORT>`. Everything below uses port `8080`:
replace it with your `WEB_PORT`. Linux is recommended for the real server; Windows needs Docker Desktop (Linux containers) running the whole event.
Needs Docker with Compose v2 and internet for the first `--build`.

## 1. Get it and configure it

**Linux / macOS**
```bash
git clone <repo-url> && cd Cyber-island
cp .env.example .env
openssl rand -hex 24          # run 3 times: DB_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
nano .env                     # also set ADMIN_LOGIN_NAME, ADMIN_PASSWORD (strong!), WEB_PORT
```

**Windows (PowerShell)**
```powershell
git clone <repo-url>; cd Cyber-island
Copy-Item .env.example .env
$b = New-Object byte[] 24; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | % { $_.ToString('x2') })   # run 3 times
notepad .env                  # same values as above
```

## 2. Start

```
docker compose up -d --build
docker compose ps             # db, backend (healthy), web = running
```

Open the firewall for `WEB_PORT`: Linux `sudo ufw allow 8080/tcp` | Windows (admin PowerShell) `New-NetFirewallRule -DisplayName CyberIsland -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow`

## 3. Test each part

**Linux / macOS**
```bash
curl -sI localhost:8080/ | head -1                                   # frontend: HTTP/1.1 200
curl -s localhost:8080/ | grep -o '<title>[^<]*'                     # frontend: game title
curl -so /dev/null -w '%{http_code}\n' localhost:8080/assets/world/CyberIsland_Base.png   # static assets: 200
curl -s localhost:8080/api/health                                    # nginx -> backend: {"ok":true}
curl -s localhost:3000/api/health                                    # backend directly (BACKEND_LOCAL_PORT): {"ok":true}
curl -so /dev/null -w '%{http_code}\n' localhost:8080/admin/         # admin page: 200
docker compose exec web nginx -t                                     # nginx config: "syntax is ok"
docker compose exec db psql -U cyber -d cyberisland -c '\dt'         # database tables exist
for i in $(seq 8); do curl -so /dev/null -w '%{http_code} ' -X POST localhost:8080/api/admin/auth/login -H 'content-type: application/json' -d '{}'; done; echo   # rate limit: 400 x6 then 429 (wait 1 min)
docker compose logs --tail=20 web backend                            # no errors; web log shows REAL client IPs
```

**Windows (PowerShell)** (`curl.exe`, not the `curl` alias)
```powershell
curl.exe -sI http://localhost:8080/                                  # frontend: HTTP/1.1 200
(curl.exe -s http://localhost:8080/) -match '<title>[^<]*'; $Matches[0]   # frontend: game title
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8080/assets/world/CyberIsland_Base.png   # static assets: 200
curl.exe -s http://localhost:8080/api/health                         # nginx -> backend: {"ok":true}
curl.exe -s http://localhost:3000/api/health                         # backend directly: {"ok":true}
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8080/admin/    # admin page: 200
docker compose exec web nginx -t                                     # nginx config: "syntax is ok"
docker compose exec db psql -U cyber -d cyberisland -c "\dt"         # database tables exist
1..8 | % { curl.exe -s -o NUL -w "%{http_code} " -X POST http://localhost:8080/api/admin/auth/login -H "content-type: application/json" -d "{}" }   # rate limit: 400 x6 then 429 (wait 1 min)
docker compose logs --tail=20 web backend                            # no errors; web log shows REAL client IPs
```

## 4. First-time setup (database starts empty)

Browser: `http://<server>:8080/admin` -> sign in -> **Initialize game data** -> **Import teams** (JSON array of `{name, loginName, password}`) -> then open `http://<server>:8080/` from another machine and log in as a team. **Start contest** in the admin page when ready.

Same from the command line (note: an API login signs the browser admin out, only one admin session exists):

**Linux / macOS**
```bash
T=$(curl -s -X POST localhost:8080/api/admin/auth/login -H 'content-type: application/json' -d '{"loginName":"ADMIN","password":"PASS"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')
curl -s -X POST localhost:8080/api/admin/setup/initialize -H "authorization: Bearer $T"
jq '{teams: .}' teams.json | curl -s -X POST localhost:8080/api/admin/setup/teams -H "authorization: Bearer $T" -H 'content-type: application/json' -d @-
curl -s -X POST localhost:8080/api/admin/contest/start -H "authorization: Bearer $T"
```

**Windows (PowerShell)**
```powershell
$u = 'http://localhost:8080'
$t = (Invoke-RestMethod "$u/api/admin/auth/login" -Method Post -ContentType 'application/json' -Body (@{loginName='ADMIN'; password='PASS'} | ConvertTo-Json)).accessToken
$h = @{ Authorization = "Bearer $t" }
Invoke-RestMethod "$u/api/admin/setup/initialize" -Method Post -Headers $h
Invoke-RestMethod "$u/api/admin/setup/teams" -Method Post -Headers $h -ContentType 'application/json' -Body (@{teams = @(Get-Content teams.json -Raw | ConvertFrom-Json)} | ConvertTo-Json -Depth 5)
Invoke-RestMethod "$u/api/admin/contest/start" -Method Post -Headers $h
```

## 5. Run it

```
docker compose logs -f backend          # live log (also: web, db)
docker compose restart web              # after editing nginx/*.conf (admin access rules, rate limits)
docker compose up -d                    # after editing .env
git pull; docker compose up -d --build  # deploy a new version (data is kept; use && instead of ; on Linux)
docker compose down                     # stop, data kept.   NEVER add -v (deletes the database)
```

Admin only via SSH tunnel (after setting `return 403;` in `nginx/admin-access.conf` and `docker compose restart web`):
`ssh -L 8081:127.0.0.1:3000 user@server` then open `http://localhost:8081/admin`.

Backup (run before and during the contest):

**Linux / macOS**
```bash
mkdir -p backups && docker compose exec -T db pg_dump -U cyber cyberisland | gzip > backups/db-$(date +%H%M%S).sql.gz
```

**Windows (PowerShell)**
```powershell
New-Item -ItemType Directory -Force backups | Out-Null
docker compose exec db sh -c "pg_dump -U cyber -Fc cyberisland > /tmp/b.dump"; docker compose cp db:/tmp/b.dump "backups\db-$(Get-Date -Format HHmmss).dump"
```

More detail (admin access modes, port, troubleshooting): `README.md`.

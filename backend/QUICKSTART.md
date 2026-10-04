Get the docker running

from inside the backend directory
`docker compose up -d --build backend`

To access the db panel, while the backend container is up,
from inside the backend directory
`pnpm prisma studio`

To set the contest `start_at` and `end_at` values in prisma studio
(columns are stored in UTC; press Save after editing):

ISO 8601 datetime, use ONE of these two forms (never a `Z` together with an offset):

- Indian time (offset form): `YYYY-MM-DDTHH:MM:SS.sss+05:30`
  Example: `2026-10-06T16:00:00.000+05:30`
- UTC (Z form): `YYYY-MM-DDTHH:MM:SS.sssZ`
  Example (same instant as above): `2026-10-06T10:30:00.000Z`

The `T` is typed as-is. IST is UTC+05:30, so 16:00 IST = 10:30 UTC.

Setting dates does NOT start the contest. The `status` column decides whether teams can play:
set `status` to `RUNNING` together with `start_at` = now and `end_at` = start + duration
(or just call `POST /api/admin/contest/start`, see README.md).

Admin page (leaderboard, contest start/end/extend, results, team overrides):
`http://localhost:3000/admin` (from other devices: `http://<laptop-ip>:3000/admin`).
Log in with ADMIN_LOGIN_NAME / ADMIN_PASSWORD from `.env`.
After editing files in `backend/admin/`, rebuild the container: `docker compose up -d --build backend`.

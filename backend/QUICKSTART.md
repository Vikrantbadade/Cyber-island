Get the docker running

from inside the backend directory
`docker compose up -d --build backend`

To access the db panel, while the backend container is up,
from inside the backend directory
`pnpm prisma studio`

To set 'start_time' and 'end_time' values in prisma studio,
the datetime format is:
`YYYY-MM-DDTHH:MM:SS.sssZ`, where T and Z are copied as is
for indian time (not the default UTC):
`YYYY-MM-DDTHH:MM:SS.sssZ+HH:MM`, where T and Z are copied as is
Example:
2026-10-06T16:00:00.000Z+05:30

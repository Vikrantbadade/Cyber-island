import { app } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

process.env.TZ = process.env.TZ ?? env.CONTEST_TIMEZONE;

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`CyberIsland backend listening on 0.0.0.0:${env.PORT} (${env.NODE_ENV}, tz ${env.CONTEST_TIMEZONE})`);
  console.log(`Admin page: http://localhost:${env.PORT}/admin  (or http://<this machine's LAN IP>:${env.PORT}/admin)`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

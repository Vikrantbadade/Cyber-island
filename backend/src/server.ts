import { app } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { prepareTeamIntegrity } from './services/team-integrity.service';

process.env.TZ = process.env.TZ ?? env.CONTEST_TIMEZONE;

// Node 22 terminates the process on an unhandled rejection; during an event it is better to log and stay up.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

async function main() {
  // Install the team-insert trigger and backfill progress rows for teams that were added by hand
  await prepareTeamIntegrity();

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
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

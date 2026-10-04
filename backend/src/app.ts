import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import contestRoutes from './routes/contest.routes';
import teamRoutes from './routes/team.routes';

export function createApp() {
  const app = express();

  app.use(cors()); // frontend and admin pages are served from other origins on the LAN
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Admin web page (static files in backend/admin/). The files contain no data: every call the page
  // makes goes to /api/admin/* and needs an admin JWT. Resolves to backend/admin in dev (src/) and /app/admin
  // in Docker (dist/). Strict CSP: the page uses no inline scripts/styles and only talks to its own origin.
  app.use(
    '/admin',
    express.static(path.join(__dirname, '..', 'admin'), {
      setHeaders(res) {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
        );
      },
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/contest', contestRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export const app = createApp();

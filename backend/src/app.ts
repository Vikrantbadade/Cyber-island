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

  app.use('/api/auth', authRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/contest', contestRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export const app = createApp();

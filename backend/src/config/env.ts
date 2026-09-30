import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('30m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('6h'),
  ADMIN_LOGIN_NAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  CONTEST_TIMEZONE: z.string().default('Asia/Kolkata'),
  CONTEST_DURATION_MINUTES: z.coerce.number().int().positive().default(180),
  CONTEST_GRACE_SECONDS: z.coerce.number().int().nonnegative().default(2),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

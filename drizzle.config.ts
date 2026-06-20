import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: ['./src/entities/**/*.schema.ts', './src/lib/auth/auth.schema.ts'],
  out: './scripts/migrations',
  dialect: 'postgresql',
  migrations: {
    prefix: 'supabase',
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;

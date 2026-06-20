import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { dbConfig } from '@/config/db.config';
import { ConfigurationError } from '@/lib/errors';

type Database = ReturnType<typeof drizzle>;

export const dbEnabled = !!dbConfig.url;

function createDisabledDb(): Database {
  return new Proxy({} as Database, {
    get: () => {
      throw new ConfigurationError('Database module requires DATABASE_URL');
    },
  });
}

export const db: Database = dbEnabled
  ? drizzle(neon(dbConfig.url))
  : createDisabledDb();

export type DbClient = Database;

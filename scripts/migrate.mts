import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

config({ path: '.env.local' });
config();

if (!process.env.DATABASE_URL) {
  console.log('DB module disabled (no DATABASE_URL), skipping migrations');
  process.exit(0);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

await migrate(db, { migrationsFolder: './scripts/migrations' });

console.log('Migrations applied');

import { config } from 'dotenv';

config({ path: '.env.local' });
config();

if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET) {
  console.log('Seed skipped: requires DATABASE_URL and BETTER_AUTH_SECRET');
  process.exit(0);
}

const required = ['SEED_DEV_EMAIL', 'SEED_DEV_PASSWORD', 'SEED_DEV_NAME'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Seed failed: missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const { auth } = await import('@/lib/auth');

const result = await auth.api.signUpEmail({
  body: {
    email: process.env.SEED_DEV_EMAIL!,
    password: process.env.SEED_DEV_PASSWORD!,
    name: process.env.SEED_DEV_NAME!,
  },
  headers: new Headers(),
});

console.log('Seeded dev user:', { email: process.env.SEED_DEV_EMAIL, result });

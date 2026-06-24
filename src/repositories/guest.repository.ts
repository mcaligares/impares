import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { guest } from '@/entities/guest/guest.schema';
import type { Guest } from '@/entities/guest/guest.entity';
import type { DbClient } from './types';

const log = logger.repo('guest');

export async function insertGuest(db: DbClient, input: { name: string }): Promise<Guest> {
  const start = performance.now();
  log('insertGuest', 'start', {});
  try {
    const result = await db.insert(guest).values(input).returning();
    log('insertGuest', 'done', { id: result[0].id, ms: performance.now() - start });
    return result[0];
  } catch (err) {
    log.error('insertGuest', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function findGuestById(db: DbClient, id: string): Promise<Guest | null> {
  const start = performance.now();
  log('findGuestById', 'start', { id });
  try {
    const result = await db.select().from(guest).where(eq(guest.id, id)).limit(1);
    log('findGuestById', 'done', { id, ms: performance.now() - start });
    return result[0] ?? null;
  } catch (err) {
    log.error('findGuestById', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function updateGuestName(db: DbClient, id: string, name: string): Promise<Guest> {
  const start = performance.now();
  log('updateGuestName', 'start', { id });
  try {
    const result = await db.update(guest).set({ name }).where(eq(guest.id, id)).returning();
    log('updateGuestName', 'done', { id, ms: performance.now() - start });
    return result[0];
  } catch (err) {
    log.error('updateGuestName', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { voter } from '@/entities/voter/voter.schema';
import type { Voter } from '@/entities/voter/voter.entity';
import type { DbClient } from './types';

const log = logger.repo('voter');

export async function insertVoter(db: DbClient, input: { name: string }): Promise<Voter> {
  const start = performance.now();
  log('insertVoter', 'start', {});
  try {
    const result = await db.insert(voter).values(input).returning();
    log('insertVoter', 'done', { id: result[0].id, ms: performance.now() - start });
    return result[0];
  } catch (err) {
    log.error('insertVoter', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function findVoterById(db: DbClient, id: string): Promise<Voter | null> {
  const start = performance.now();
  log('findVoterById', 'start', { id });
  try {
    const result = await db.select().from(voter).where(eq(voter.id, id)).limit(1);
    log('findVoterById', 'done', { id, ms: performance.now() - start });
    return result[0] ?? null;
  } catch (err) {
    log.error('findVoterById', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function updateVoterName(db: DbClient, id: string, name: string): Promise<Voter> {
  const start = performance.now();
  log('updateVoterName', 'start', { id });
  try {
    const result = await db.update(voter).set({ name }).where(eq(voter.id, id)).returning();
    log('updateVoterName', 'done', { id, ms: performance.now() - start });
    return result[0];
  } catch (err) {
    log.error('updateVoterName', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

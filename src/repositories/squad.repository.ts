import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { squad } from '@/entities/squad/squad.schema';
import type { Squad } from '@/entities/squad/squad.entity';
import type { DbClient } from './types';

const log = logger.repo('squad');

export type InsertSquad = {
  match_id?: string | null;
  source?: string | null;
  status?: Squad['status'];
  row_count?: number;
  created_count?: number;
  updated_count?: number;
};

export type UpdateSquad = {
  status?: Squad['status'];
  created_count?: number;
  updated_count?: number;
  error?: string | null;
};

export async function insertSquad(db: DbClient, input: InsertSquad): Promise<Squad> {
  const start = performance.now();
  log('insertSquad', 'start', { matchId: input.match_id });
  try {
    const result = await db.insert(squad).values(input).returning();
    log('insertSquad', 'done', { id: result[0].id, ms: performance.now() - start });
    return result[0];
  } catch (err) {
    log.error('insertSquad', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function updateSquadStatus(
  db: DbClient,
  id: string,
  input: UpdateSquad,
): Promise<void> {
  const start = performance.now();
  log('updateSquadStatus', 'start', { id, status: input.status });
  try {
    await db.update(squad).set(input).where(eq(squad.id, id));
    log('updateSquadStatus', 'done', { id, ms: performance.now() - start });
  } catch (err) {
    log.error('updateSquadStatus', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

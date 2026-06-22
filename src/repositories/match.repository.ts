import { logger } from '@/lib/logger';
import { match } from '@/entities/match/match.schema';
import type { Match } from '@/entities/match/match.entity';
import type { DbClient } from './types';

const log = logger.repo('match');

export type InsertMatch = {
  match_date: Date;
  location?: string | null;
  notes?: string | null;
};

export async function insertMatch(db: DbClient, input: InsertMatch): Promise<Match> {
  const start = performance.now();
  log('insertMatch', 'start', { date: input.match_date });
  try {
    const result = await db.insert(match).values(input).returning();
    log('insertMatch', 'done', { id: result[0].id, ms: performance.now() - start });
    return result[0];
  } catch (err) {
    log.error('insertMatch', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

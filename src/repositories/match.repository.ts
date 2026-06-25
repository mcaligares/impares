import { eq, desc } from 'drizzle-orm';
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

export async function findMatchById(db: DbClient, id: number): Promise<Match | null> {
  const start = performance.now();
  log('findMatchById', 'start', { id });
  try {
    const result = await db.select().from(match).where(eq(match.id, id)).limit(1);
    log('findMatchById', 'done', { id, ms: performance.now() - start });
    return result[0] ?? null;
  } catch (err) {
    log.error('findMatchById', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function findRecentMatches(db: DbClient, limit: number): Promise<Match[]> {
  const start = performance.now();
  log('findRecentMatches', 'start', { limit });
  try {
    const result = await db.select().from(match).orderBy(desc(match.match_date)).limit(limit);
    log('findRecentMatches', 'done', { count: result.length, ms: performance.now() - start });
    return result;
  } catch (err) {
    log.error('findRecentMatches', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

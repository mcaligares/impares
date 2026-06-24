import { eq, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { matchPlayer } from '@/entities/match-player/match-player.schema';
import type { MatchPlayer } from '@/entities/match-player/match-player.entity';
import type { PlayerAttributes } from '@/entities/player/player.schema';
import type { DbClient } from './types';

const log = logger.repo('match-player');

export type InsertMatchPlayer = {
  match_id: string;
  player_id: string;
  batch_id?: string | null;
  team?: MatchPlayer['team'];
  rating_snapshot?: PlayerAttributes | null;
};

export async function insertMatchPlayers(
  db: DbClient,
  rows: InsertMatchPlayer[],
): Promise<MatchPlayer[]> {
  const start = performance.now();
  log('insertMatchPlayers', 'start', { count: rows.length });
  try {
    const result = await db.insert(matchPlayer).values(rows).returning();
    log('insertMatchPlayers', 'done', { count: result.length, ms: performance.now() - start });
    return result;
  } catch (err) {
    log.error('insertMatchPlayers', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function findMatchPlayersByMatch(
  db: DbClient,
  matchId: string,
): Promise<MatchPlayer[]> {
  const start = performance.now();
  log('findMatchPlayersByMatch', 'start', { matchId });
  try {
    const result = await db.select().from(matchPlayer).where(eq(matchPlayer.match_id, matchId));
    log('findMatchPlayersByMatch', 'done', { matchId, count: result.length, ms: performance.now() - start });
    return result;
  } catch (err) {
    log.error('findMatchPlayersByMatch', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function assignTeam(
  db: DbClient,
  ids: string[],
  team: 'a' | 'b',
): Promise<void> {
  const start = performance.now();
  log('assignTeam', 'start', { team, count: ids.length });
  try {
    await db.update(matchPlayer).set({ team }).where(inArray(matchPlayer.id, ids));
    log('assignTeam', 'done', { team, ms: performance.now() - start });
  } catch (err) {
    log.error('assignTeam', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

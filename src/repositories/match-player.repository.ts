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

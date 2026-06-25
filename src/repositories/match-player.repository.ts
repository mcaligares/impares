import { eq, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { matchPlayer } from '@/entities/match-player/match-player.schema';
import { player } from '@/entities/player/player.schema';
import type { MatchPlayer } from '@/entities/match-player/match-player.entity';
import type { PlayerAttributes } from '@/entities/player/player.schema';
import type { DbClient } from './types';

export type LineupRow = {
  team: MatchPlayer['team'];
  player_id: string;
  name: string;
  attributes: PlayerAttributes | null;
};

const log = logger.repo('match-player');

export type InsertMatchPlayer = {
  match_id: number;
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
  matchId: number,
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

export async function findLineupWithPlayers(
  db: DbClient,
  matchId: number,
): Promise<LineupRow[]> {
  const start = performance.now();
  log('findLineupWithPlayers', 'start', { matchId });
  try {
    const result = await db
      .select({
        team: matchPlayer.team,
        player_id: matchPlayer.player_id,
        name: player.name,
        attributes: player.attributes,
      })
      .from(matchPlayer)
      .innerJoin(player, eq(matchPlayer.player_id, player.id))
      .where(eq(matchPlayer.match_id, matchId));
    log('findLineupWithPlayers', 'done', { count: result.length, ms: performance.now() - start });
    return result;
  } catch (err) {
    log.error('findLineupWithPlayers', 'failed', { err, ms: performance.now() - start });
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

import type { PlayerAttributes } from '@/entities/player/player.schema';
import type { MatchPlayer } from '@/entities/match-player/match-player.entity';
import type { InsertMatchPlayer } from '@/repositories/match-player.repository';
import type { ScoredPlayer } from '@/services/balance.service';

export function toPlayerAttributes(input: {
  mobility?: number;
  endurance?: number;
}): PlayerAttributes | undefined {
  const attributes: PlayerAttributes = {};
  if (input.mobility !== undefined) attributes.mobility = input.mobility;
  if (input.endurance !== undefined) attributes.endurance = input.endurance;
  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

export function toLineupRows(
  matchId: string,
  batchId: string,
  items: { playerId: string; attributes?: PlayerAttributes }[],
): InsertMatchPlayer[] {
  return items.map((item) => ({
    match_id: matchId,
    player_id: item.playerId,
    batch_id: batchId,
    team: 'unassigned',
    rating_snapshot: item.attributes ?? null,
  }));
}

export function toScoredPlayers(
  rows: MatchPlayer[],
  scorer: (attributes?: PlayerAttributes | null) => number,
): ScoredPlayer[] {
  return rows.map((row) => ({
    matchPlayerId: row.id,
    playerId: row.player_id,
    score: scorer(row.rating_snapshot),
  }));
}

export function toMatchPlayerIds(players: ScoredPlayer[]): string[] {
  return players.map((player) => player.matchPlayerId);
}

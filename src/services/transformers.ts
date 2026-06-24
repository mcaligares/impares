import type { PlayerAttributes, PlayerWeight } from '@/entities/player/player.schema';
import type { InsertMatchPlayer } from '@/repositories/match-player.repository';

export function weightToAttributes(weight?: PlayerWeight): PlayerAttributes | undefined {
  if (!weight) return undefined;
  return { weight };
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

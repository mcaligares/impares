import type { PlayerAttributes } from '@/entities/player/player.schema';
import type { Match } from '@/entities/match/match.entity';
import type { MatchPlayer } from '@/entities/match-player/match-player.entity';
import type { InsertMatchPlayer, LineupRow } from '@/repositories/match-player.repository';
import type { ScoredPlayer } from '@/services/balance.service';
import type { TeamPlayer, MatchTeams, RecentMatch } from '@/services/match.service';

function toTeamPlayers(rows: LineupRow[]): TeamPlayer[] {
  return rows.map((row) => ({
    playerId: row.player_id,
    name: row.name,
    mobility: row.attributes?.mobility,
    endurance: row.attributes?.endurance,
  }));
}

export function toMatchTeams(match: Match, lineup: LineupRow[]): MatchTeams {
  return {
    match,
    teamA: toTeamPlayers(lineup.filter((row) => row.team === 'a')),
    teamB: toTeamPlayers(lineup.filter((row) => row.team === 'b')),
    unassigned: toTeamPlayers(lineup.filter((row) => row.team === 'unassigned')),
  };
}

export function toRecentMatches(matches: Match[]): RecentMatch[] {
  return matches.map((match) => ({
    id: match.id,
    date: match.match_date,
    location: match.location,
    status: match.status,
  }));
}

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

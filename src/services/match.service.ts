import { logger } from '@/lib/logger';
import { appConfig } from '@/config/app.config';
import { toPlayerAttributes, toLineupRows, toMatchTeams, toRecentMatches } from './transformers';
import { insertMatch, findMatchById, findRecentMatches } from '@/repositories/match.repository';
import { insertSquad, updateSquadStatus } from '@/repositories/squad.repository';
import { upsertPlayerBySlug } from '@/repositories/player.repository';
import { insertMatchPlayers, findLineupWithPlayers } from '@/repositories/match-player.repository';
import type { DbClient } from '@/repositories/types';
import type { PlayerAttributes } from '@/entities/player/player.schema';
import type { Match } from '@/entities/match/match.entity';
import type { ParsedPlainTeam } from '@/services/parser.service';

export type TeamPlayer = {
  playerId: string;
  name: string;
  mobility?: number;
  endurance?: number;
};

export type MatchTeams = {
  match: Match;
  teamA: TeamPlayer[];
  teamB: TeamPlayer[];
  unassigned: TeamPlayer[];
};

export type RecentMatch = {
  id: string;
  date: Date;
  location: string | null;
  status: Match['status'];
};

const log = logger.service('match');

export type RegisterMatchResult = {
  matchId: string;
  createdCount: number;
  updatedCount: number;
};

export async function registerMatch(
  db: DbClient,
  parsed: ParsedPlainTeam,
): Promise<RegisterMatchResult> {
  log('registerMatch', 'start', { players: parsed.players.length });

  const match = await insertMatch(db, {
    match_date: parsed.match?.date ?? new Date(),
    location: parsed.match?.location ?? null,
  });

  const batch = await insertSquad(db, {
    match_id: match.id,
    status: 'pending',
    row_count: parsed.players.length,
  });

  try {
    let createdCount = 0;
    let updatedCount = 0;
    const lineup: { playerId: string; attributes?: PlayerAttributes }[] = [];

    for (const parsedPlayer of parsed.players) {
      const attributes = toPlayerAttributes(parsedPlayer);
      const { player, inserted } = await upsertPlayerBySlug(db, {
        name: parsedPlayer.name,
        slug: parsedPlayer.slug,
        attributes,
      });
      if (inserted) createdCount += 1;
      else updatedCount += 1;
      lineup.push({ playerId: player.id, attributes });
    }

    await insertMatchPlayers(db, toLineupRows(match.id, batch.id, lineup));
    await updateSquadStatus(db, batch.id, {
      status: 'processed',
      created_count: createdCount,
      updated_count: updatedCount,
    });

    log('registerMatch', 'done', { matchId: match.id, createdCount, updatedCount });
    return { matchId: match.id, createdCount, updatedCount };
  } catch (err) {
    log.error('registerMatch', 'failed', { err });
    await updateSquadStatus(db, batch.id, { status: 'failed', error: String(err) });
    throw err;
  }
}

export async function getMatchTeams(db: DbClient, matchId: string): Promise<MatchTeams> {
  log('getMatchTeams', 'start', { matchId });
  const match = await findMatchById(db, matchId);
  if (!match) {
    throw new Error('Match not found');
  }
  const lineup = await findLineupWithPlayers(db, matchId);
  log('getMatchTeams', 'done', { matchId, players: lineup.length });
  return toMatchTeams(match, lineup);
}

export async function listRecentMatches(db: DbClient): Promise<RecentMatch[]> {
  log('listRecentMatches', 'start', {});
  const matches = await findRecentMatches(db, appConfig.pagination.defaultPageSize);
  log('listRecentMatches', 'done', { count: matches.length });
  return toRecentMatches(matches);
}

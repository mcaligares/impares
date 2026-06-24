import { logger } from '@/lib/logger';
import { toPlayerAttributes, toLineupRows } from './transformers';
import { insertMatch } from '@/repositories/match.repository';
import { insertSquad, updateSquadStatus } from '@/repositories/squad.repository';
import { upsertPlayerBySlug } from '@/repositories/player.repository';
import { insertMatchPlayers } from '@/repositories/match-player.repository';
import type { DbClient } from '@/repositories/types';
import type { PlayerAttributes } from '@/entities/player/player.schema';
import type { ParsedPlainTeam } from '@/services/parser.service';

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

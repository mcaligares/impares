import { logger } from '@/lib/logger';
import { parseRosterText, type ParseWarning } from '@/utils/roster-parser';
import { weightToAttributes, toLineupRows } from './transformers';
import { insertMatch } from '@/repositories/match.repository';
import { insertSquad, updateSquadStatus } from '@/repositories/squad.repository';
import { upsertPlayerBySlug } from '@/repositories/player.repository';
import { insertMatchPlayers } from '@/repositories/match-player.repository';
import type { DbClient } from '@/repositories/types';
import type { PlayerAttributes } from '@/entities/player/player.schema';

const log = logger.service('import');

export type ImportTeamInput = {
  raw: string;
};

export type ImportTeamResult = {
  matchId: string;
  createdCount: number;
  updatedCount: number;
  warnings: ParseWarning[];
};

export async function importTeam(db: DbClient, input: ImportTeamInput): Promise<ImportTeamResult> {
  log('importTeam', 'start', {});

  const parsed = parseRosterText(input.raw, new Date().getFullYear());
  if (parsed.players.length === 0) {
    throw new Error('No players found in the pasted text');
  }

  const match = await insertMatch(db, {
    match_date: parsed.match?.date ?? new Date(),
    location: parsed.match?.location ?? null,
  });

  const batch = await insertSquad(db, {
    match_id: match.id,
    source: input.raw,
    status: 'pending',
    row_count: parsed.players.length,
  });

  try {
    let createdCount = 0;
    let updatedCount = 0;
    const lineup: { playerId: string; attributes?: PlayerAttributes }[] = [];

    for (const parsedPlayer of parsed.players) {
      const attributes = weightToAttributes(parsedPlayer.weight);
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

    log('importTeam', 'done', { matchId: match.id, createdCount, updatedCount });
    return { matchId: match.id, createdCount, updatedCount, warnings: parsed.warnings };
  } catch (err) {
    log.error('importTeam', 'failed', { err });
    await updateSquadStatus(db, batch.id, { status: 'failed', error: String(err) });
    throw err;
  }
}

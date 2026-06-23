'use server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { parsePlainTeam, type ParseWarning } from '@/services/parser.service';
import { registerMatch, type RegisterMatchResult } from '@/services/match.service';
import type { ActionResponse } from '@/actions/types';

const log = logger.action('match');

export type RegisterMatchData = RegisterMatchResult & {
  warnings: ParseWarning[];
};

export async function registerMatchFromText(raw: string): Promise<ActionResponse<RegisterMatchData>> {
  log('registerMatchFromText', 'start', { length: raw?.length ?? 0 });
  try {
    if (!raw || raw.trim().length === 0) {
      return { success: false, error: 'empty', message: 'Paste the players list' };
    }
    const parsed = parsePlainTeam(raw, new Date().getFullYear());
    if (parsed.players.length === 0) {
      return { success: false, error: 'empty', message: 'No players found in the pasted text' };
    }
    const result = await registerMatch(db, parsed);
    log('registerMatchFromText', 'success', { matchId: result.matchId });
    return { success: true, data: { ...result, warnings: parsed.warnings } };
  } catch (err) {
    log.error('registerMatchFromText', 'failed', { err });
    return { success: false, error: String(err), message: 'Could not register the match' };
  }
}

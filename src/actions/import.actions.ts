'use server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { importTeam as importTeamService, type ImportTeamResult } from '@/services/import.service';
import type { ActionResponse } from '@/actions/types';

const log = logger.action('import');

export async function importTeam(raw: string): Promise<ActionResponse<ImportTeamResult>> {
  log('importTeam', 'start', { length: raw?.length ?? 0 });
  try {
    if (!raw || raw.trim().length === 0) {
      return { success: false, error: 'empty', message: 'Paste the players list' };
    }
    const result = await importTeamService(db, { raw });
    log('importTeam', 'success', { matchId: result.matchId });
    return { success: true, data: result };
  } catch (err) {
    log.error('importTeam', 'failed', { err });
    return { success: false, error: String(err), message: 'Import failed' };
  }
}

'use server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { balanceMatchTeams, type BalancedTeams } from '@/services/balance.service';
import type { ActionResponse } from '@/actions/types';

const log = logger.action('balance');

export async function balanceTeams(matchId: number): Promise<ActionResponse<BalancedTeams>> {
  log('balanceTeams', 'start', { matchId });
  try {
    if (!matchId) {
      return { success: false, error: 'missing-match', message: 'Match id is required' };
    }
    const result = await balanceMatchTeams(db, matchId);
    log('balanceTeams', 'success', { matchId });
    return { success: true, data: result };
  } catch (err) {
    log.error('balanceTeams', 'failed', { err });
    return { success: false, error: String(err), message: 'Could not balance teams' };
  }
}

'use server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { balanceConfig } from '@/config/balance.config';
import { parsePlainTeam, type ParseWarning } from '@/services/parser.service';
import {
  registerMatch,
  getMatchTeams as getMatchTeamsService,
  listRecentMatches as listRecentMatchesService,
  type RegisterMatchResult,
  type MatchTeams,
  type RecentMatch,
} from '@/services/match.service';
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
    if (parsed.players.length < balanceConfig.minPlayers) {
      return {
        success: false,
        error: 'too-few-players',
        message: `Se necesitan al menos ${balanceConfig.minPlayers} jugadores para armar los equipos`,
      };
    }
    const result = await registerMatch(db, parsed);
    log('registerMatchFromText', 'success', { matchId: result.matchId });
    return { success: true, data: { ...result, warnings: parsed.warnings } };
  } catch (err) {
    log.error('registerMatchFromText', 'failed', { err });
    return { success: false, error: String(err), message: 'Could not register the match' };
  }
}

export async function getMatchTeams(matchId: number): Promise<ActionResponse<MatchTeams>> {
  log('getMatchTeams', 'start', { matchId });
  try {
    if (!matchId) {
      return { success: false, error: 'missing-match', message: 'Match id is required' };
    }
    const data = await getMatchTeamsService(db, matchId);
    return { success: true, data };
  } catch (err) {
    log.error('getMatchTeams', 'failed', { err });
    return { success: false, error: String(err), message: 'Could not load the match' };
  }
}

export async function listRecentMatches(): Promise<ActionResponse<RecentMatch[]>> {
  try {
    const data = await listRecentMatchesService(db);
    return { success: true, data };
  } catch (err) {
    log.error('listRecentMatches', 'failed', { err });
    return { success: false, error: String(err), message: 'Could not load matches' };
  }
}

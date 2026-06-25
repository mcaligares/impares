import { logger } from '@/lib/logger';
import { scorePlayer } from '@/services/scoring.service';
import { toScoredPlayers, toMatchPlayerIds } from './transformers';
import {
  findMatchPlayersByMatch,
  assignTeam,
} from '@/repositories/match-player.repository';
import type { DbClient } from '@/repositories/types';

const log = logger.service('balance');

export type ScoredPlayer = {
  matchPlayerId: string;
  playerId: string;
  score: number;
};

export type BalancedTeams = {
  teamA: { players: ScoredPlayer[]; totalScore: number };
  teamB: { players: ScoredPlayer[]; totalScore: number };
};

export function balanceTeams(players: ScoredPlayer[]): BalancedTeams {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const capA = Math.ceil(sorted.length / 2);
  const capB = Math.floor(sorted.length / 2);

  const a: ScoredPlayer[] = [];
  const b: ScoredPlayer[] = [];
  let totalA = 0;
  let totalB = 0;

  for (const player of sorted) {
    const canA = a.length < capA;
    const canB = b.length < capB;
    const pickA = canA && (!canB || totalA <= totalB);
    if (pickA) {
      a.push(player);
      totalA += player.score;
    } else {
      b.push(player);
      totalB += player.score;
    }
  }

  return {
    teamA: { players: a, totalScore: totalA },
    teamB: { players: b, totalScore: totalB },
  };
}

export async function balanceMatchTeams(db: DbClient, matchId: number): Promise<BalancedTeams> {
  log('balanceMatchTeams', 'start', { matchId });

  const rows = await findMatchPlayersByMatch(db, matchId);
  if (rows.length === 0) {
    throw new Error('Match has no players to balance');
  }

  const balanced = balanceTeams(toScoredPlayers(rows, scorePlayer));

  if (balanced.teamA.players.length > 0) {
    await assignTeam(db, toMatchPlayerIds(balanced.teamA.players), 'a');
  }
  if (balanced.teamB.players.length > 0) {
    await assignTeam(db, toMatchPlayerIds(balanced.teamB.players), 'b');
  }

  log('balanceMatchTeams', 'done', {
    matchId,
    a: balanced.teamA.players.length,
    b: balanced.teamB.players.length,
  });
  return balanced;
}

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

export type RandomSource = () => number;

const SAMPLE_ROUNDS = 200;

export function balanceTeams(players: ScoredPlayer[], random: RandomSource = Math.random): BalancedTeams {
  const capA = Math.ceil(players.length / 2);
  const capB = Math.floor(players.length / 2);

  let bestGap = Infinity;
  let candidates: BalancedTeams[] = [];

  for (let round = 0; round < SAMPLE_ROUNDS; round += 1) {
    const partition = assignShuffled(players, capA, capB, random);
    const gap = Math.abs(partition.teamA.totalScore - partition.teamB.totalScore);
    if (gap < bestGap) {
      bestGap = gap;
      candidates = [partition];
    } else if (gap === bestGap) {
      candidates.push(partition);
    }
  }

  return candidates[Math.floor(random() * candidates.length)];
}

function assignShuffled(
  players: ScoredPlayer[],
  capA: number,
  capB: number,
  random: RandomSource,
): BalancedTeams {
  const order = shuffle(players, random);
  const a: ScoredPlayer[] = [];
  const b: ScoredPlayer[] = [];
  let totalA = 0;
  let totalB = 0;

  for (const player of order) {
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

function shuffle(players: ScoredPlayer[], random: RandomSource): ScoredPlayer[] {
  const arr = [...players];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

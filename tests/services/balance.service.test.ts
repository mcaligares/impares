import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockDb } from '../helpers/mock-db';
import { createMatchPlayerRow } from '../factories/match.factory';
import {
  balanceTeams,
  balanceMatchTeams,
  type ScoredPlayer,
  type RandomSource,
} from '@/services/balance.service';

vi.mock('@/repositories/match-player.repository', () => ({
  findMatchPlayersByMatch: vi.fn(),
  assignTeam: vi.fn(),
}));

const repo = await import('@/repositories/match-player.repository');

function scored(...scores: number[]): ScoredPlayer[] {
  return scores.map((score, index) => ({
    matchPlayerId: `mp-${index}`,
    playerId: `p-${index}`,
    score,
  }));
}

function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function compositionKey(result: ReturnType<typeof balanceTeams>): string {
  const sides = [result.teamA.players, result.teamB.players]
    .map((side) => side.map((p) => p.matchPlayerId).sort().join('+'))
    .sort();
  return sides.join('|');
}

beforeEach(() => vi.clearAllMocks());

describe('balanceTeams', () => {
  it('splits an even number into equal teams', () => {
    const result = balanceTeams(scored(5, 4, 3, 2));
    expect(result.teamA.players).toHaveLength(2);
    expect(result.teamB.players).toHaveLength(2);
  });

  it('splits an odd number with sizes differing by one', () => {
    const result = balanceTeams(scored(5, 4, 3, 2, 1));
    const sizes = [result.teamA.players.length, result.teamB.players.length].sort();
    expect(sizes).toEqual([2, 3]);
  });

  it('assigns every player exactly once', () => {
    const result = balanceTeams(scored(5, 4, 3, 2, 1));
    const ids = [...result.teamA.players, ...result.teamB.players].map((p) => p.matchPlayerId);
    expect(new Set(ids).size).toBe(5);
  });

  it('minimizes the score gap', () => {
    const result = balanceTeams(scored(5, 4, 3, 2));
    expect(Math.abs(result.teamA.totalScore - result.teamB.totalScore)).toBeLessThanOrEqual(1);
  });

  it('is deterministic for a given random source', () => {
    const players = scored(5, 4, 3, 2, 1, 1);
    const first = balanceTeams(players, seededRandom(42));
    const second = balanceTeams(players, seededRandom(42));
    expect(second).toEqual(first);
  });

  it('varies the teams across runs when alternatives exist', () => {
    const players = scored(3, 3, 3, 3);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 20; seed += 1) {
      seen.add(compositionKey(balanceTeams(players, seededRandom(seed))));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('returns the same split when only one optimal partition exists', () => {
    const players = scored(10, 9, 1, 0);
    const a = balanceTeams(players, seededRandom(1));
    const b = balanceTeams(players, seededRandom(999));
    expect(compositionKey(a)).toBe(compositionKey(b));
    expect(Math.abs(a.teamA.totalScore - a.teamB.totalScore)).toBe(0);
  });
});

describe('balanceMatchTeams', () => {
  it('balances a match and persists a and b for all rows', async () => {
    const db = createMockDb();
    vi.mocked(repo.findMatchPlayersByMatch).mockResolvedValue([
      createMatchPlayerRow('mp-1', { mobility: 5, endurance: 5 }),
      createMatchPlayerRow('mp-2', { mobility: 1, endurance: 1 }),
      createMatchPlayerRow('mp-3', { mobility: 4, endurance: 3 }),
      createMatchPlayerRow('mp-4', { mobility: 2, endurance: 2 }),
    ]);

    const result = await balanceMatchTeams(db, 1);

    expect(result.teamA.players.length + result.teamB.players.length).toBe(4);
    expect(repo.assignTeam).toHaveBeenCalledWith(db, expect.any(Array), 'a');
    expect(repo.assignTeam).toHaveBeenCalledWith(db, expect.any(Array), 'b');
  });

  it('overwrites previous team assignments on re-run', async () => {
    const db = createMockDb();
    vi.mocked(repo.findMatchPlayersByMatch).mockResolvedValue([
      createMatchPlayerRow('mp-1', { mobility: 5, endurance: 5 }, { team: 'a' }),
      createMatchPlayerRow('mp-2', { mobility: 1, endurance: 1 }, { team: 'a' }),
    ]);

    await balanceMatchTeams(db, 1);

    expect(repo.assignTeam).toHaveBeenCalled();
  });

  it('throws when the match has no players', async () => {
    const db = createMockDb();
    vi.mocked(repo.findMatchPlayersByMatch).mockResolvedValue([]);

    await expect(balanceMatchTeams(db, 1)).rejects.toThrow('no players');
    expect(repo.assignTeam).not.toHaveBeenCalled();
  });
});

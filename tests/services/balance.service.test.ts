import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockDb } from '../helpers/mock-db';
import { createMatchPlayerRow } from '../factories/match.factory';
import { balanceTeams, balanceMatchTeams, type ScoredPlayer } from '@/services/balance.service';

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

    const result = await balanceMatchTeams(db, 'match-1');

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

    await balanceMatchTeams(db, 'match-1');

    expect(repo.assignTeam).toHaveBeenCalled();
  });

  it('throws when the match has no players', async () => {
    const db = createMockDb();
    vi.mocked(repo.findMatchPlayersByMatch).mockResolvedValue([]);

    await expect(balanceMatchTeams(db, 'match-1')).rejects.toThrow('no players');
    expect(repo.assignTeam).not.toHaveBeenCalled();
  });
});

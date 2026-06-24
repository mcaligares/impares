import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockDb } from '../helpers/mock-db';
import { createPlayerWithSlug, createMatch, createSquad } from '../factories/match.factory';
import { registerMatch } from '@/services/match.service';
import type { ParsedPlainTeam } from '@/services/parser.service';

vi.mock('@/repositories/match.repository', () => ({ insertMatch: vi.fn() }));
vi.mock('@/repositories/squad.repository', () => ({
  insertSquad: vi.fn(),
  updateSquadStatus: vi.fn(),
}));
vi.mock('@/repositories/player.repository', () => ({ upsertPlayerBySlug: vi.fn() }));
vi.mock('@/repositories/match-player.repository', () => ({ insertMatchPlayers: vi.fn() }));

const matchRepo = await import('@/repositories/match.repository');
const squadRepo = await import('@/repositories/squad.repository');
const playerRepo = await import('@/repositories/player.repository');
const lineupRepo = await import('@/repositories/match-player.repository');

function parsedWith(...names: string[]): ParsedPlainTeam {
  return {
    match: { title: 'Futbol Lujan', location: 'Futbol Lujan', date: new Date() },
    players: names.map((name, index) => ({ order: index + 1, name, slug: name.toLowerCase() })),
    warnings: [],
  };
}

describe('registerMatch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates the match, upserts players, links the lineup as unassigned, and records the squad', async () => {
    const db = createMockDb();
    vi.mocked(matchRepo.insertMatch).mockResolvedValue(createMatch({ id: 'match-1' }));
    vi.mocked(squadRepo.insertSquad).mockResolvedValue(createSquad({ id: 'squad-1' }));
    vi.mocked(lineupRepo.insertMatchPlayers).mockResolvedValue([]);
    vi.mocked(playerRepo.upsertPlayerBySlug)
      .mockResolvedValueOnce({ player: createPlayerWithSlug('mati', 'mati'), inserted: true })
      .mockResolvedValueOnce({ player: createPlayerWithSlug('gonza', 'Gonza'), inserted: false });

    const result = await registerMatch(db, parsedWith('mati', 'Gonza'));

    expect(result.matchId).toBe('match-1');
    expect(result.createdCount).toBe(1);
    expect(result.updatedCount).toBe(1);

    const lineupRows = vi.mocked(lineupRepo.insertMatchPlayers).mock.calls[0][1];
    expect(lineupRows).toHaveLength(2);
    expect(lineupRows.every((row) => row.team === 'unassigned')).toBe(true);

    expect(squadRepo.updateSquadStatus).toHaveBeenCalledWith(db, 'squad-1', {
      status: 'processed',
      created_count: 1,
      updated_count: 1,
    });
  });

  it('marks the squad failed when persistence breaks mid-pipeline', async () => {
    const db = createMockDb();
    vi.mocked(matchRepo.insertMatch).mockResolvedValue(createMatch({ id: 'match-1' }));
    vi.mocked(squadRepo.insertSquad).mockResolvedValue(createSquad({ id: 'squad-1' }));
    vi.mocked(playerRepo.upsertPlayerBySlug).mockRejectedValue(new Error('db down'));

    await expect(registerMatch(db, parsedWith('mati'))).rejects.toThrow('db down');

    expect(squadRepo.updateSquadStatus).toHaveBeenCalledWith(
      db,
      'squad-1',
      expect.objectContaining({ status: 'failed' }),
    );
  });
});

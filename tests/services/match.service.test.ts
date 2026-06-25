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
vi.mock('@/repositories/player.repository', () => ({ findPlayerBySlug: vi.fn(), upsertPlayerBySlug: vi.fn() }));
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

  it('creates the match, upserts players, links the lineup split into balanced teams, and records the squad', async () => {
    const db = createMockDb();
    vi.mocked(matchRepo.insertMatch).mockResolvedValue(createMatch({ id: 1 }));
    vi.mocked(squadRepo.insertSquad).mockResolvedValue(createSquad({ id: 'squad-1' }));
    vi.mocked(lineupRepo.insertMatchPlayers).mockResolvedValue([]);
    vi.mocked(playerRepo.upsertPlayerBySlug)
      .mockResolvedValueOnce({ player: createPlayerWithSlug('mati', 'mati'), inserted: true })
      .mockResolvedValueOnce({ player: createPlayerWithSlug('gonza', 'Gonza'), inserted: false });

    const result = await registerMatch(db, parsedWith('mati', 'Gonza'));

    expect(result.matchId).toBe(1);
    expect(result.createdCount).toBe(1);
    expect(result.updatedCount).toBe(1);

    const lineupRows = vi.mocked(lineupRepo.insertMatchPlayers).mock.calls[0][1];
    expect(lineupRows).toHaveLength(2);
    expect(lineupRows.some((row) => row.team === 'unassigned')).toBe(false);
    expect(lineupRows.map((row) => row.team).sort()).toEqual(['a', 'b']);

    expect(squadRepo.updateSquadStatus).toHaveBeenCalledWith(db, 'squad-1', {
      status: 'processed',
      created_count: 1,
      updated_count: 1,
    });
  });

  it('defaults missing characteristics to 3 when upserting players', async () => {
    const db = createMockDb();
    vi.mocked(matchRepo.insertMatch).mockResolvedValue(createMatch({ id: 1 }));
    vi.mocked(squadRepo.insertSquad).mockResolvedValue(createSquad({ id: 'squad-1' }));
    vi.mocked(lineupRepo.insertMatchPlayers).mockResolvedValue([]);
    vi.mocked(playerRepo.upsertPlayerBySlug)
      .mockResolvedValueOnce({ player: createPlayerWithSlug('mati', 'mati'), inserted: true })
      .mockResolvedValueOnce({ player: createPlayerWithSlug('gonza', 'Gonza'), inserted: false });

    await registerMatch(db, parsedWith('mati', 'Gonza'));

    const firstUpsert = vi.mocked(playerRepo.upsertPlayerBySlug).mock.calls[0][1];
    expect(firstUpsert.attributes).toEqual({ mobility: 3, endurance: 3 });
  });

  it('assigns the match two distinct team colors', async () => {
    const db = createMockDb();
    vi.mocked(matchRepo.insertMatch).mockResolvedValue(createMatch({ id: 'match-1' }));
    vi.mocked(squadRepo.insertSquad).mockResolvedValue(createSquad({ id: 'squad-1' }));
    vi.mocked(lineupRepo.insertMatchPlayers).mockResolvedValue([]);
    vi.mocked(playerRepo.findPlayerBySlug).mockResolvedValue(null);
    vi.mocked(playerRepo.upsertPlayerBySlug).mockResolvedValue({
      player: createPlayerWithSlug('x', 'x'),
      inserted: true,
    });

    await registerMatch(db, parsedWith('mati', 'Gonza'));

    const insertArg = vi.mocked(matchRepo.insertMatch).mock.calls[0][1];
    expect(insertArg.team_a_color).toBeTruthy();
    expect(insertArg.team_b_color).toBeTruthy();
    expect(insertArg.team_a_color).not.toBe(insertArg.team_b_color);
  });

  it('preserves the stored value when the list omits a characteristic, 3 only if never had one', async () => {
    const db = createMockDb();
    vi.mocked(matchRepo.insertMatch).mockResolvedValue(createMatch({ id: 1 }));
    vi.mocked(squadRepo.insertSquad).mockResolvedValue(createSquad({ id: 'squad-1' }));
    vi.mocked(lineupRepo.insertMatchPlayers).mockResolvedValue([]);
    vi.mocked(playerRepo.findPlayerBySlug)
      .mockResolvedValueOnce(createPlayerWithSlug('mati', 'mati', { attributes: { mobility: 4, endurance: 2 } }))
      .mockResolvedValueOnce(null);
    vi.mocked(playerRepo.upsertPlayerBySlug)
      .mockResolvedValueOnce({ player: createPlayerWithSlug('mati', 'mati'), inserted: false })
      .mockResolvedValueOnce({ player: createPlayerWithSlug('gonza', 'Gonza'), inserted: true });

    await registerMatch(db, parsedWith('mati', 'Gonza'));

    expect(vi.mocked(playerRepo.upsertPlayerBySlug).mock.calls[0][1].attributes).toEqual({
      mobility: 4,
      endurance: 2,
    });
    expect(vi.mocked(playerRepo.upsertPlayerBySlug).mock.calls[1][1].attributes).toEqual({
      mobility: 3,
      endurance: 3,
    });
  });

  it('aborts without creating anything when there are too few players to balance', async () => {
    const db = createMockDb();

    await expect(registerMatch(db, parsedWith('solo'))).rejects.toThrow(/at least/i);

    expect(matchRepo.insertMatch).not.toHaveBeenCalled();
    expect(squadRepo.insertSquad).not.toHaveBeenCalled();
    expect(playerRepo.upsertPlayerBySlug).not.toHaveBeenCalled();
    expect(lineupRepo.insertMatchPlayers).not.toHaveBeenCalled();
  });

  it('marks the squad failed when persistence breaks mid-pipeline', async () => {
    const db = createMockDb();
    vi.mocked(matchRepo.insertMatch).mockResolvedValue(createMatch({ id: 1 }));
    vi.mocked(squadRepo.insertSquad).mockResolvedValue(createSquad({ id: 'squad-1' }));
    vi.mocked(playerRepo.upsertPlayerBySlug).mockRejectedValue(new Error('db down'));

    await expect(registerMatch(db, parsedWith('mati', 'Gonza'))).rejects.toThrow('db down');

    expect(squadRepo.updateSquadStatus).toHaveBeenCalledWith(
      db,
      'squad-1',
      expect.objectContaining({ status: 'failed' }),
    );
  });
});

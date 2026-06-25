import type { Player } from '@/entities/player/player.entity';
import type { Match } from '@/entities/match/match.entity';
import type { Squad } from '@/entities/squad/squad.entity';
import type { MatchPlayer } from '@/entities/match-player/match-player.entity';
import type { PlayerAttributes } from '@/entities/player/player.schema';

export function createPlayerWithSlug(
  slug: string,
  name: string,
  overrides: Partial<Player> = {},
): Player {
  const now = new Date();
  return {
    id: `player-${slug}`,
    name,
    slug,
    attributes: null,
    active: true,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createMatch(overrides: Partial<Match> = {}): Match {
  const now = new Date();
  return {
    id: 1,
    match_date: now,
    location: 'Futbol Lujan',
    status: 'scheduled',
    team_a_score: null,
    team_b_score: null,
    team_a_color: null,
    team_b_color: null,
    notes: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createSquad(overrides: Partial<Squad> = {}): Squad {
  const now = new Date();
  return {
    id: 'squad-1',
    match_id: 1,
    source: null,
    status: 'pending',
    row_count: 0,
    created_count: 0,
    updated_count: 0,
    error: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createMatchPlayerRow(
  id: string,
  rating_snapshot: PlayerAttributes | null = null,
  overrides: Partial<MatchPlayer> = {},
): MatchPlayer {
  const now = new Date();
  return {
    id,
    match_id: 1,
    player_id: `player-${id}`,
    team: 'unassigned',
    batch_id: 'squad-1',
    rating_snapshot,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createPlainTeamText(
  names: string[],
  header = 'Futbol Lujan - 10/06 20:30hs',
): string {
  const lines = names.map((name, index) => `${index + 1}- ${name}`);
  return [header, ...lines].join('\n');
}

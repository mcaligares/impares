import { pgTable, uuid, integer, jsonb, pgEnum, unique } from 'drizzle-orm/pg-core';
import { timestamps } from '@/lib/db/timestamps';
import { match } from '@/entities/match/match.schema';
import { player, type PlayerAttributes } from '@/entities/player/player.schema';
import { squad } from '@/entities/squad/squad.schema';

export const teamSide = pgEnum('team_side', ['a', 'b', 'unassigned']);

export const matchPlayer = pgTable(
  'match_player',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    match_id: integer('match_id')
      .notNull()
      .references(() => match.id, { onDelete: 'cascade' }),
    player_id: uuid('player_id')
      .notNull()
      .references(() => player.id, { onDelete: 'restrict' }),
    team: teamSide('team').notNull().default('unassigned'),
    batch_id: uuid('batch_id').references(() => squad.id, { onDelete: 'set null' }),
    rating_snapshot: jsonb('rating_snapshot').$type<PlayerAttributes>(),
    ...timestamps,
  },
  (t) => [unique('match_player_match_id_player_id_unique').on(t.match_id, t.player_id)],
);

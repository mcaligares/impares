import { pgTable, uuid, text, boolean, jsonb } from 'drizzle-orm/pg-core';
import { timestamps } from '@/lib/db/timestamps';

export type PlayerPosition = 'gk' | 'def' | 'mid' | 'fwd';

export type PlayerWeight = 'pluma' | 'tanque';

export type PlayerAttributes = {
  attack?: number;
  defense?: number;
  stamina?: number;
  speed?: number;
  goalkeeping?: number;
  position?: PlayerPosition;
  weight?: PlayerWeight;
};

export const player = pgTable('player', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  attributes: jsonb('attributes').$type<PlayerAttributes>(),
  active: boolean('active').notNull().default(true),
  ...timestamps,
});

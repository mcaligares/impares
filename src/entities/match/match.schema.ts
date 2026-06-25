import { pgTable, integer, text, smallint, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from '@/lib/db/timestamps';

export const matchStatus = pgEnum('match_status', [
  'scheduled',
  'teams_drawn',
  'played',
  'cancelled',
]);

export const match = pgTable('match', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  match_date: timestamp('match_date').notNull(),
  location: text('location'),
  status: matchStatus('status').notNull().default('scheduled'),
  team_a_score: smallint('team_a_score'),
  team_b_score: smallint('team_b_score'),
  notes: text('notes'),
  ...timestamps,
});

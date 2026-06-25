import { pgTable, uuid, text, integer, pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from '@/lib/db/timestamps';
import { match } from '@/entities/match/match.schema';

export const squadStatus = pgEnum('squad_status', ['pending', 'processed', 'failed']);

export const squad = pgTable('squad', {
  id: uuid('id').primaryKey().defaultRandom(),
  match_id: integer('match_id').references(() => match.id, { onDelete: 'set null' }),
  source: text('source'),
  status: squadStatus('status').notNull().default('pending'),
  row_count: integer('row_count').notNull().default(0),
  created_count: integer('created_count').notNull().default(0),
  updated_count: integer('updated_count').notNull().default(0),
  error: text('error'),
  ...timestamps,
});

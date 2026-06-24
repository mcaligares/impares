import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
import { timestamps } from '@/lib/db/timestamps';

export const voter = pgTable('voter', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ...timestamps,
});

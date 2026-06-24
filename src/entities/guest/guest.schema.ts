import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
import { timestamps } from '@/lib/db/timestamps';

export const guest = pgTable('guest', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ...timestamps,
});

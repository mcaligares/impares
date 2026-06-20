import { pgTable, text, integer, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@/lib/db/timestamps';
import { user } from '@/entities/user/user.schema';

export const storage = pgTable('storage', {
  id: uuid('id').primaryKey().defaultRandom(),
  bucket: text('bucket').notNull(),
  key: text('key').notNull().unique(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  owner_id: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  entity_type: text('entity_type'),
  entity_id: text('entity_id'),
  ...timestamps,
});

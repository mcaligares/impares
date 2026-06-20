import { pgTable, text, boolean } from 'drizzle-orm/pg-core';
import { timestamps } from '@/lib/db/timestamps';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  email_verified: boolean('email_verified').notNull().default(false),
  name: text('name'),
  image: text('image'),
  ...timestamps,
});

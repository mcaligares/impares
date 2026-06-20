import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { timestamps } from '@/lib/db/timestamps';
import { user } from '@/entities/user/user.schema';

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expires_at: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  user_id: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  ...timestamps,
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  account_id: text('account_id').notNull(),
  provider_id: text('provider_id').notNull(),
  user_id: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  access_token: text('access_token'),
  refresh_token: text('refresh_token'),
  id_token: text('id_token'),
  access_token_expires_at: timestamp('access_token_expires_at'),
  refresh_token_expires_at: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  ...timestamps,
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  ...timestamps,
});

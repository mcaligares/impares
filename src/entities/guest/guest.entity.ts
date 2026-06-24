import type { InferSelectModel } from 'drizzle-orm';
import { guest } from './guest.schema';

export type Guest = InferSelectModel<typeof guest>;

import type { InferSelectModel } from 'drizzle-orm';
import { storage } from './storage.schema';

export type Storage = InferSelectModel<typeof storage>;

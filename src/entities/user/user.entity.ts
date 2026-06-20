import type { InferSelectModel } from 'drizzle-orm';
import { user } from './user.schema';

export type User = InferSelectModel<typeof user>;

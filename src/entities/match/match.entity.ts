import type { InferSelectModel } from 'drizzle-orm';
import { match } from './match.schema';

export type Match = InferSelectModel<typeof match>;

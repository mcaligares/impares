import type { InferSelectModel } from 'drizzle-orm';
import { voter } from './voter.schema';

export type Voter = InferSelectModel<typeof voter>;

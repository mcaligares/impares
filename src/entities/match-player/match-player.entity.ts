import type { InferSelectModel } from 'drizzle-orm';
import { matchPlayer } from './match-player.schema';

export type MatchPlayer = InferSelectModel<typeof matchPlayer>;

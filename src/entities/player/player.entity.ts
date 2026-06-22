import type { InferSelectModel } from 'drizzle-orm';
import { player } from './player.schema';

export type Player = InferSelectModel<typeof player>;

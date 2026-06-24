import type { InferSelectModel } from 'drizzle-orm';
import { squad } from './squad.schema';

export type Squad = InferSelectModel<typeof squad>;

import { eq, getTableColumns, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { player } from '@/entities/player/player.schema';
import type { Player } from '@/entities/player/player.entity';
import type { PlayerAttributes } from '@/entities/player/player.schema';
import type { DbClient } from './types';

const log = logger.repo('player');

export type UpsertPlayer = {
  name: string;
  slug: string;
  attributes?: PlayerAttributes;
};

export type UpsertResult = {
  player: Player;
  inserted: boolean;
};

export async function findPlayerBySlug(db: DbClient, slug: string): Promise<Player | null> {
  const start = performance.now();
  log('findPlayerBySlug', 'start', { slug });
  try {
    const result = await db.select().from(player).where(eq(player.slug, slug)).limit(1);
    log('findPlayerBySlug', 'done', { slug, ms: performance.now() - start });
    return result[0] ?? null;
  } catch (err) {
    log.error('findPlayerBySlug', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function upsertPlayerBySlug(db: DbClient, input: UpsertPlayer): Promise<UpsertResult> {
  const start = performance.now();
  log('upsertPlayerBySlug', 'start', { slug: input.slug });
  try {
    const set: { name: string; attributes?: PlayerAttributes } = { name: input.name };
    if (input.attributes !== undefined) set.attributes = input.attributes;

    const result = await db
      .insert(player)
      .values({ name: input.name, slug: input.slug, attributes: input.attributes })
      .onConflictDoUpdate({ target: player.slug, set })
      .returning({ ...getTableColumns(player), inserted: sql<boolean>`(xmax::text::bigint = 0)` });

    const { inserted, ...row } = result[0];
    log('upsertPlayerBySlug', 'done', { slug: input.slug, inserted, ms: performance.now() - start });
    return { player: row, inserted };
  } catch (err) {
    log.error('upsertPlayerBySlug', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

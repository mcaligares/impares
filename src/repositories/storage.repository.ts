import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { storage } from '@/entities/storage/storage.schema';
import type { Storage } from '@/entities/storage/storage.entity';
import type { DbClient } from './types';

const log = logger.repo('storage');

export type InsertStorage = {
  bucket: string;
  key: string;
  mime: string;
  size: number;
  owner_id: string;
  entity_type?: string | null;
  entity_id?: string | null;
};

export async function insertStorage(db: DbClient, input: InsertStorage): Promise<Storage> {
  const start = performance.now();
  log('insertStorage', 'start', { key: input.key });
  try {
    const result = await db.insert(storage).values(input).returning();
    log('insertStorage', 'done', { key: input.key, ms: performance.now() - start });
    return result[0];
  } catch (err) {
    log.error('insertStorage', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function findStorageById(db: DbClient, id: string): Promise<Storage | null> {
  const start = performance.now();
  log('findStorageById', 'start', { id });
  try {
    const result = await db.select().from(storage).where(eq(storage.id, id)).limit(1);
    log('findStorageById', 'done', { id, ms: performance.now() - start });
    return result[0] ?? null;
  } catch (err) {
    log.error('findStorageById', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

export async function deleteStorage(db: DbClient, id: string): Promise<void> {
  const start = performance.now();
  log('deleteStorage', 'start', { id });
  try {
    await db.delete(storage).where(eq(storage.id, id));
    log('deleteStorage', 'done', { id, ms: performance.now() - start });
  } catch (err) {
    log.error('deleteStorage', 'failed', { err, ms: performance.now() - start });
    throw err;
  }
}

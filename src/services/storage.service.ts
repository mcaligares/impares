import { randomUUID } from 'node:crypto';
import { logger } from '@/lib/logger';
import { createPresignedUploadUrl, type PresignedUpload } from '@/lib/storage/presigned';
import { storageConfig, type BucketScope } from '@/config/storage.config';
import { UnauthorizedError } from '@/lib/errors';
import {
  deleteStorage as deleteStorageRepo,
  findStorageById,
  insertStorage,
} from '@/repositories/storage.repository';
import type { Storage } from '@/entities/storage/storage.entity';
import type { DbClient } from '@/repositories/types';

const log = logger.service('storage');

export type RequestUploadInput = {
  scope: BucketScope;
  mime: string;
  size: number;
  entityType?: string;
  entityId?: string;
};

export type RequestUploadResult = PresignedUpload & {
  storage: Storage;
};

export async function requestUpload(
  db: DbClient,
  userId: string,
  input: RequestUploadInput,
): Promise<RequestUploadResult> {
  log('requestUpload', 'start', { userId, scope: input.scope, mime: input.mime, size: input.size });

  if (!storageConfig.upload.allowedMimeTypes.includes(input.mime as never)) {
    throw new Error(`Mime type not allowed: ${input.mime}`);
  }
  if (input.size > storageConfig.upload.maxSizeBytes) {
    throw new Error(`File exceeds max size: ${input.size}`);
  }

  const key = `${input.scope}/${userId}/${randomUUID()}`;
  const presigned = await createPresignedUploadUrl(input.scope, key, input.mime, input.size);

  const record = await insertStorage(db, {
    bucket: presigned.bucket,
    key: presigned.key,
    mime: input.mime,
    size: input.size,
    owner_id: userId,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
  });

  log('requestUpload', 'done', { storageId: record.id });
  return { ...presigned, storage: record };
}

export async function deleteStorage(
  db: DbClient,
  userId: string,
  storageId: string,
): Promise<void> {
  log('deleteStorage', 'start', { userId, storageId });

  const record = await findStorageById(db, storageId);
  if (!record) throw new Error('Storage record not found');
  if (record.owner_id !== userId) throw new UnauthorizedError();

  await deleteStorageRepo(db, storageId);
  log('deleteStorage', 'done', { storageId });
}

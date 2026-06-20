'use server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { logger } from '@/lib/logger';
import { UnauthorizedError } from '@/lib/errors';
import {
  deleteStorage as deleteStorageService,
  requestUpload,
  type RequestUploadInput,
  type RequestUploadResult,
} from '@/services/storage.service';
import type { ActionResponse } from '@/actions/types';

const log = logger.action('storage');

export async function requestUploadUrl(
  input: RequestUploadInput,
): Promise<ActionResponse<RequestUploadResult>> {
  log('requestUploadUrl', 'start', { scope: input.scope, mime: input.mime });
  try {
    const user = await getCurrentUser();
    const result = await requestUpload(db, user.id, input);
    log('requestUploadUrl', 'success', { storageId: result.storage.id });
    return { success: true, data: result };
  } catch (err) {
    log.error('requestUploadUrl', 'failed', { err });
    if (err instanceof UnauthorizedError) {
      return { success: false, error: 'unauthorized', message: 'Not allowed' };
    }
    return { success: false, error: String(err), message: 'Upload request failed' };
  }
}

export async function deleteStorageObject(storageId: string): Promise<ActionResponse> {
  log('deleteStorageObject', 'start', { storageId });
  try {
    const user = await getCurrentUser();
    await deleteStorageService(db, user.id, storageId);
    log('deleteStorageObject', 'success', { storageId });
    return { success: true, message: 'Deleted' };
  } catch (err) {
    log.error('deleteStorageObject', 'failed', { err });
    if (err instanceof UnauthorizedError) {
      return { success: false, error: 'unauthorized', message: 'Not allowed' };
    }
    return { success: false, error: String(err), message: 'Delete failed' };
  }
}

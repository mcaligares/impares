import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockDb } from '../helpers/mock-db';
import { createStorageForOwner } from '../factories/storage.factory';
import { UnauthorizedError } from '@/lib/errors';
import { deleteStorage } from '@/services/storage.service';

vi.mock('@/repositories/storage.repository', () => ({
  findStorageById: vi.fn(),
  deleteStorage: vi.fn(),
  insertStorage: vi.fn(),
}));

vi.mock('@/lib/storage/presigned', () => ({
  createPresignedUploadUrl: vi.fn(),
}));

const repo = await import('@/repositories/storage.repository');

describe('deleteStorage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes when actor owns the record', async () => {
    const db = createMockDb();
    const record = createStorageForOwner('user-1');
    vi.mocked(repo.findStorageById).mockResolvedValue(record);

    await deleteStorage(db, 'user-1', record.id);

    expect(repo.deleteStorage).toHaveBeenCalledWith(db, record.id);
  });

  it('throws UnauthorizedError when actor does not own the record', async () => {
    const db = createMockDb();
    const record = createStorageForOwner('other-user');
    vi.mocked(repo.findStorageById).mockResolvedValue(record);

    await expect(deleteStorage(db, 'user-1', record.id)).rejects.toThrow(UnauthorizedError);
    expect(repo.deleteStorage).not.toHaveBeenCalled();
  });

  it('throws when record does not exist', async () => {
    const db = createMockDb();
    vi.mocked(repo.findStorageById).mockResolvedValue(null);

    await expect(deleteStorage(db, 'user-1', 'missing')).rejects.toThrow('not found');
  });
});

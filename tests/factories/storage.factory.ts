import type { Storage } from '@/entities/storage/storage.entity';

export function createStorageForOwner(ownerId: string, overrides: Partial<Storage> = {}): Storage {
  const now = new Date();
  return {
    id: 'storage-id',
    bucket: 'test-bucket',
    key: `public/${ownerId}/file.png`,
    mime: 'image/png',
    size: 1024,
    owner_id: ownerId,
    entity_type: null,
    entity_id: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createStorageOwnedByOther(ownerId: string): Storage {
  return createStorageForOwner('other-user', { owner_id: 'other-user' });
}

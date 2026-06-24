import { logger } from '@/lib/logger';
import { insertGuest, findGuestById, updateGuestName } from '@/repositories/guest.repository';
import type { DbClient } from '@/repositories/types';
import type { Guest } from '@/entities/guest/guest.entity';

const log = logger.service('guest');

export async function getGuest(db: DbClient, id: string): Promise<Guest | null> {
  log('getGuest', 'start', { id });
  return findGuestById(db, id);
}

export async function saveGuest(
  db: DbClient,
  input: { id?: string | null; name: string },
): Promise<Guest> {
  log('saveGuest', 'start', { hasId: Boolean(input.id) });
  if (input.id) {
    const existing = await findGuestById(db, input.id);
    if (existing) {
      return updateGuestName(db, input.id, input.name);
    }
  }
  return insertGuest(db, { name: input.name });
}

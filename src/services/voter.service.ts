import { logger } from '@/lib/logger';
import { insertVoter, findVoterById, updateVoterName } from '@/repositories/voter.repository';
import type { DbClient } from '@/repositories/types';
import type { Voter } from '@/entities/voter/voter.entity';

const log = logger.service('voter');

export async function getVoter(db: DbClient, id: string): Promise<Voter | null> {
  log('getVoter', 'start', { id });
  return findVoterById(db, id);
}

export async function saveVoter(
  db: DbClient,
  input: { id?: string | null; name: string },
): Promise<Voter> {
  log('saveVoter', 'start', { hasId: Boolean(input.id) });
  if (input.id) {
    const existing = await findVoterById(db, input.id);
    if (existing) {
      return updateVoterName(db, input.id, input.name);
    }
  }
  return insertVoter(db, { name: input.name });
}

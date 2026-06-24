'use server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getVoterId, setVoterId } from '@/lib/session/voter-cookie';
import { getVoter, saveVoter } from '@/services/voter.service';
import { voterNameSchema } from '@/lib/validators/voter.validator';
import type { ActionResponse } from '@/actions/types';
import type { Voter } from '@/entities/voter/voter.entity';

const log = logger.action('voter');

export async function identifyVoter(name: string): Promise<ActionResponse<Voter>> {
  log('identifyVoter', 'start', {});
  try {
    const parsed = voterNameSchema.safeParse({ name });
    if (!parsed.success) {
      return { success: false, error: 'invalid', message: parsed.error.issues[0]?.message ?? 'Nombre inválido' };
    }
    const cookieId = await getVoterId();
    const voter = await saveVoter(db, { id: cookieId, name: parsed.data.name });
    if (voter.id !== cookieId) {
      await setVoterId(voter.id);
    }
    log('identifyVoter', 'success', { id: voter.id });
    return { success: true, data: voter };
  } catch (err) {
    log.error('identifyVoter', 'failed', { err });
    return { success: false, error: String(err), message: 'No se pudo guardar tu nombre' };
  }
}

export async function getCurrentVoter(): Promise<Voter | null> {
  const id = await getVoterId();
  if (!id) return null;
  return getVoter(db, id);
}

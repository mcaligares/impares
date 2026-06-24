'use server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getGuestId, setGuestId } from '@/lib/session/guest-cookie';
import { getGuest, saveGuest } from '@/services/guest.service';
import { guestNameSchema } from '@/lib/validators/guest.validator';
import type { ActionResponse } from '@/actions/types';
import type { Guest } from '@/entities/guest/guest.entity';

const log = logger.action('guest');

export async function identifyGuest(name: string): Promise<ActionResponse<Guest>> {
  log('identifyGuest', 'start', {});
  try {
    const parsed = guestNameSchema.safeParse({ name });
    if (!parsed.success) {
      return { success: false, error: 'invalid', message: parsed.error.issues[0]?.message ?? 'Nombre inválido' };
    }
    const cookieId = await getGuestId();
    const guest = await saveGuest(db, { id: cookieId, name: parsed.data.name });
    if (guest.id !== cookieId) {
      await setGuestId(guest.id);
    }
    log('identifyGuest', 'success', { id: guest.id });
    return { success: true, data: guest };
  } catch (err) {
    log.error('identifyGuest', 'failed', { err });
    return { success: false, error: String(err), message: 'No se pudo guardar tu nombre' };
  }
}

export async function getCurrentGuest(): Promise<Guest | null> {
  const id = await getGuestId();
  if (!id) return null;
  return getGuest(db, id);
}

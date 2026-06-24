import { cookies } from 'next/headers';
import { sessionConfig } from '@/config/session.config';

export async function getVoterId(): Promise<string | null> {
  const store = await cookies();
  return store.get(sessionConfig.cookie.name)?.value ?? null;
}

export async function setVoterId(id: string): Promise<void> {
  const store = await cookies();
  store.set(sessionConfig.cookie.name, id, {
    httpOnly: true,
    sameSite: sessionConfig.cookie.sameSite,
    path: sessionConfig.cookie.path,
    maxAge: sessionConfig.cookie.maxAge,
  });
}

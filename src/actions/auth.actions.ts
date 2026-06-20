'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import type { ActionResponse } from '@/actions/types';

const log = logger.action('auth');

export async function signInWithEmailAndPassword(
  email: string,
  password: string,
): Promise<ActionResponse> {
  log('signInWithEmailAndPassword', 'start', { email });
  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
    log('signInWithEmailAndPassword', 'success', { email });
    return { success: true, message: 'Signed in' };
  } catch (err) {
    log.error('signInWithEmailAndPassword', 'failed', { email, err });
    return { success: false, error: String(err), message: 'Invalid credentials' };
  }
}

export async function signUpWithEmailAndPassword(
  email: string,
  password: string,
  name: string,
): Promise<ActionResponse> {
  log('signUpWithEmailAndPassword', 'start', { email });
  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
      headers: await headers(),
    });
    log('signUpWithEmailAndPassword', 'success', { email });
    return { success: true, message: 'Account created. Check your email to verify.' };
  } catch (err) {
    log.error('signUpWithEmailAndPassword', 'failed', { email, err });
    return { success: false, error: String(err), message: 'Sign up failed' };
  }
}

export async function sendMagicLink(email: string): Promise<ActionResponse> {
  log('sendMagicLink', 'start', { email });
  try {
    await auth.api.signInMagicLink({
      body: { email },
      headers: await headers(),
    });
    log('sendMagicLink', 'success', { email });
    return { success: true, message: 'Magic link sent' };
  } catch (err) {
    log.error('sendMagicLink', 'failed', { email, err });
    return { success: false, error: String(err), message: 'Could not send magic link' };
  }
}

export async function signOut(): Promise<ActionResponse> {
  log('signOut', 'start', {});
  try {
    await auth.api.signOut({ headers: await headers() });
    log('signOut', 'success', {});
    return { success: true, message: 'Signed out' };
  } catch (err) {
    log.error('signOut', 'failed', { err });
    return { success: false, error: String(err), message: 'Sign out failed' };
  }
}

import type { DbClient } from '@/repositories/types';

export function createMockDb(): DbClient {
  return {} as DbClient;
}

export function createMockSession(userId: string) {
  return {
    user: {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
    },
    session: {
      id: 'mock-session-id',
      userId,
      token: 'mock-session-token',
      expiresAt: new Date(Date.now() + 1_000_000),
    },
  };
}

export function createMockNoSession() {
  return null;
}

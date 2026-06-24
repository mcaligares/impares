export const sessionConfig = {
  cookie: {
    name: 'voter_id',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  },
} as const;

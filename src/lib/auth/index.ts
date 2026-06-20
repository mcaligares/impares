import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { db } from '@/lib/db';
import { user } from '@/entities/user/user.schema';
import * as authInfra from './auth.schema';
import { ConfigurationError } from '@/lib/errors';

const authSchema = { user, ...authInfra };
import {
  sendMagicLinkEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from './email';

export const authEnabled =
  !!process.env.BETTER_AUTH_SECRET && !!process.env.BETTER_AUTH_URL;

function buildAuth() {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail(user.email, url);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerificationEmail(user.email, url);
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url);
        },
      }),
    ],
  });
}

type AuthInstance = ReturnType<typeof buildAuth>;

function createDisabledAuth(): AuthInstance {
  return new Proxy({} as AuthInstance, {
    get: () => {
      throw new ConfigurationError(
        'Auth module requires BETTER_AUTH_SECRET and BETTER_AUTH_URL',
      );
    },
  });
}

export const auth: AuthInstance = authEnabled ? buildAuth() : createDisabledAuth();

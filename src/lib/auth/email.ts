import { Resend } from 'resend';
import { ConfigurationError } from '@/lib/errors';

const emailEnabled = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

const resend = emailEnabled ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM ?? '';

function getClient(): Resend {
  if (!resend) {
    throw new ConfigurationError('Email module requires RESEND_API_KEY and EMAIL_FROM');
  }
  return resend;
}

export async function sendMagicLinkEmail(to: string, url: string) {
  await getClient().emails.send({
    from,
    to,
    subject: 'Your sign-in link',
    text: `Sign in: ${url}`,
  });
}

export async function sendVerificationEmail(to: string, url: string) {
  await getClient().emails.send({
    from,
    to,
    subject: 'Verify your email',
    text: `Verify your email: ${url}`,
  });
}

export async function sendPasswordResetEmail(to: string, url: string) {
  await getClient().emails.send({
    from,
    to,
    subject: 'Reset your password',
    text: `Reset your password: ${url}`,
  });
}

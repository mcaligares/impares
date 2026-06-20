import { ConfigurationError, UnauthorizedError } from '@/lib/errors';

const isEnabled = !!process.env.CRON_SECRET_KEY;

export function assertCronAuth(request: Request): void {
  if (!isEnabled) {
    throw new ConfigurationError('Cron module requires CRON_SECRET_KEY');
  }
  const header = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET_KEY}`;
  if (header !== expected) throw new UnauthorizedError('Invalid cron secret');
}

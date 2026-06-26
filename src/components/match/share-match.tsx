'use client';

import { appConfig } from '@/config/app.config';

type ShareMatchProps = {
  matchId: number;
};

export function ShareMatch({ matchId }: ShareMatchProps) {
  const configuredOrigin = appConfig.siteUrl;
  const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const origin = (configuredOrigin || browserOrigin).replace(/\/+$/, '');
  const matchUrl = `${origin}/partido/${matchId}`;
  const message = `${appConfig.share.matchInvite} ${matchUrl}`;
  const href = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-muted transition-colors duration-150 hover:border-cyan hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      Compartí esta elegida
    </a>
  );
}

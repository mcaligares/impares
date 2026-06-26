'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { balanceTeams } from '@/actions/balance.actions';
import { TeamBoard } from '@/components/match/team-board';
import { MatchList } from '@/components/match/match-list';
import type { MatchTeams, RecentMatch } from '@/services/match.service';

export function MatchClient({ teams, recent }: { teams: MatchTeams; recent: RecentMatch[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleBuild = () => {
    startTransition(async () => {
      await balanceTeams(teams.match.id);
      router.refresh();
    });
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-12 sm:px-6">
      <header className="a-fade-up mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-muted transition hover:text-cyan"
        >
          ← impares
        </Link>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          {teams.match.location ?? 'Partido'}
        </h1>
        <p className="text-sm text-muted">{new Date(teams.match.match_date).toLocaleString('es-AR')}</p>
      </header>

      <section className="a-fade-up" style={{ animationDelay: '100ms' }}>
        <TeamBoard teams={teams} onBuild={handleBuild} busy={pending} />
      </section>

      <section className="a-fade-up mt-14 pt-6 sm:mt-24 sm:pt-10" style={{ animationDelay: '200ms' }}>
        <h2 className="mb-5 text-center font-display text-2xl uppercase tracking-wide text-white">Últimos partidos</h2>
        <MatchList matches={recent} />
      </section>
    </main>
  );
}

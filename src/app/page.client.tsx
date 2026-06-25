'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registerMatchFromText } from '@/actions/match.actions';
import { RegisterForm } from '@/components/match/register-form';
import { MatchList } from '@/components/match/match-list';
import { fireConfetti } from '@/components/ui/confetti';
import type { RecentMatch } from '@/services/match.service';

export function HomeClient({
  initialMatches,
}: {
  initialMatches: RecentMatch[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const handleSubmit = (raw: string) => {
    setError(undefined);
    startTransition(async () => {
      const res = await registerMatchFromText(raw);
      if (res.success && res.data) {
        fireConfetti();
        router.push(`/partido/${res.data.matchId}`);
      } else {
        setError(res.message ?? 'No se pudo crear el partido');
      }
    });
  };

  return (
    <main className="relative mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">

      <header className="a-fade-up mb-12 text-center">
        <h1 className="font-display text-6xl uppercase leading-[0.88] tracking-tight text-white sm:text-8xl">
          impa<span className="text-cyan">res</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted sm:text-lg">
          Olvidate de <span className="text-white">hacer la elegida</span>, pegá la lista y mandá los equipos al grupo.
        </p>
      </header>

      <section
        className="a-fade-up mx-auto max-w-xl rounded-2xl border border-line bg-surface/40 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur sm:p-8"
        style={{ animationDelay: '120ms' }}
      >
        <RegisterForm onSubmit={handleSubmit} busy={pending} error={error} />
      </section>

      <section className="a-fade-up mt-14 pt-6 sm:mt-24 sm:pt-10" style={{ animationDelay: '220ms' }}>
        <h2 className="mb-5 text-center font-display text-2xl uppercase tracking-wide text-white">Últimos partidos</h2>
        <MatchList matches={initialMatches} />
      </section>
    </main>
  );
}

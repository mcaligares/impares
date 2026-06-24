'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registerMatchFromText } from '@/actions/match.actions';
import { identifyVoter } from '@/actions/voter.actions';
import { RegisterForm } from '@/components/match/register-form';
import { MatchList } from '@/components/match/match-list';
import { IdentityBar } from '@/components/identity/identity-bar';
import { Confetti } from '@/components/ui/confetti';
import type { RecentMatch } from '@/services/match.service';
import type { Voter } from '@/entities/voter/voter.entity';

export function HomeClient({
  initialMatches,
  voter,
}: {
  initialMatches: RecentMatch[];
  voter: Voter | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [identifying, startIdentify] = useTransition();

  const handleSubmit = (raw: string) => {
    setError(undefined);
    startTransition(async () => {
      const res = await registerMatchFromText(raw);
      if (res.success && res.data) {
        router.push(`/matches/${res.data.matchId}`);
      } else {
        setError(res.message ?? 'No se pudo crear el partido');
      }
    });
  };

  const handleIdentify = (name: string) => {
    startIdentify(async () => {
      await identifyVoter(name);
      router.refresh();
    });
  };

  return (
    <main className="relative mx-auto max-w-5xl px-6 pb-24 pt-8">
      <Confetti />

      <div className="a-fade-up mb-10 flex justify-end">
        <IdentityBar voter={voter} onIdentify={handleIdentify} busy={identifying} />
      </div>

      <header className="a-fade-up mb-12 text-center">
        <p className="mb-4 inline-block rounded-full border border-line bg-surface/60 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan">
          ⚽ Armador de equipos
        </p>
        <h1 className="font-display text-7xl uppercase leading-[0.88] tracking-tight text-white sm:text-8xl">
          impa<span className="text-cyan">res</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted sm:text-lg">
          Pegá la lista del grupo y armamos <span className="text-white">dos equipos parejos</span> al toque. Sin
          discusiones, sin &ldquo;el equipo de los buenos&rdquo;.
        </p>
      </header>

      <section
        className="a-fade-up mx-auto max-w-xl rounded-2xl border border-line bg-surface/40 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur sm:p-8"
        style={{ animationDelay: '120ms' }}
      >
        <RegisterForm onSubmit={handleSubmit} busy={pending} error={error} />
      </section>

      <section className="a-fade-up mt-16" style={{ animationDelay: '220ms' }}>
        <h2 className="mb-5 font-display text-2xl uppercase tracking-wide text-white">Últimos partidos</h2>
        <MatchList matches={initialMatches} />
      </section>
    </main>
  );
}

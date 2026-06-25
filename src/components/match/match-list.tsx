import Link from 'next/link';
import type { RecentMatch } from '@/services/match.service';

export function MatchList({ matches }: { matches: RecentMatch[] }) {
  if (matches.length === 0) {
    return <p className="text-sm text-muted">Todavía no hay partidos. Creá el primero arriba. 👆</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((match, index) => (
        <Link
          key={match.id}
          href={`/partido/${match.id}`}
          style={{ animationDelay: `${index * 50}ms` }}
          className="a-fade-up group flex items-center justify-between rounded-xl border border-line bg-surface/70 px-4 py-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan/60 hover:bg-surface"
        >
          <div>
            <div className="font-display text-base uppercase tracking-wide text-white">
              {match.location ?? 'Partido'}
            </div>
            <div className="text-xs text-muted">{new Date(match.date).toLocaleDateString('es-AR')}</div>
          </div>
          <span className="text-cyan transition duration-200 group-hover:translate-x-1">→</span>
        </Link>
      ))}
    </div>
  );
}

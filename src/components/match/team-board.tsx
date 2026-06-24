'use client';

import { PlayerCard } from './player-card';
import { Button } from '@/components/ui/button';
import type { MatchTeams, TeamPlayer } from '@/services/match.service';

type TeamBoardProps = {
  teams: MatchTeams;
  onBuild: () => void;
  busy?: boolean;
};

export function TeamBoard({ teams, onBuild, busy = false }: TeamBoardProps) {
  const built = teams.teamA.length > 0 || teams.teamB.length > 0;

  if (!built) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl uppercase tracking-wide text-white">
            Lista <span className="text-muted">· {teams.unassigned.length}</span>
          </h2>
          <Button onClick={onBuild} disabled={busy || teams.unassigned.length === 0}>
            {busy ? 'Armando…' : 'Armar equipos'}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {teams.unassigned.map((player, index) => (
            <PlayerCard key={player.playerId} player={player} delay={index * 45} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button variant="ghost" onClick={onBuild} disabled={busy}>
          {busy ? 'Rearmando…' : 'Rearmar equipos'}
        </Button>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
        <TeamColumn title="Equipo A" accent="cyan" players={teams.teamA} />
        <div className="flex items-center justify-center py-2 md:py-12">
          <span className="a-vs font-display text-3xl uppercase text-white md:text-5xl">VS</span>
        </div>
        <TeamColumn title="Equipo B" accent="magenta" players={teams.teamB} />
      </div>
    </div>
  );
}

function TeamColumn({
  title,
  accent,
  players,
}: {
  title: string;
  accent: 'cyan' | 'magenta';
  players: TeamPlayer[];
}) {
  const color = accent === 'cyan' ? 'text-cyan' : 'text-magenta';
  const border = accent === 'cyan' ? 'border-cyan/30' : 'border-magenta/30';
  const glow =
    accent === 'cyan'
      ? 'shadow-[0_0_70px_-34px_var(--color-cyan)]'
      : 'shadow-[0_0_70px_-34px_var(--color-magenta)]';
  return (
    <section className={`a-fade-up rounded-2xl border ${border} ${glow} bg-surface-2/30 p-4`}>
      <h3 className={`mb-4 font-display text-2xl uppercase tracking-wider ${color}`}>{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {players.map((player, index) => (
          <PlayerCard key={player.playerId} player={player} accent={accent} delay={index * 45} />
        ))}
      </div>
    </section>
  );
}

'use client';

import { PlayerCard } from './player-card';
import { Button } from '@/components/ui/button';
import { colorConfig } from '@/config/color.config';
import type { MatchTeams, TeamPlayer } from '@/services/match.service';

type TeamBoardProps = {
  teams: MatchTeams;
  onBuild: () => void;
  busy?: boolean;
};

const REVEAL_DELAY = 1050;
const PLAYERS_DELAY = 1250;

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

  const colorA = teams.match.team_a_color ?? colorConfig.fallback.a;
  const colorB = teams.match.team_b_color ?? colorConfig.fallback.b;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button variant="ghost" onClick={onBuild} disabled={busy}>
          {busy ? 'Rearmando…' : 'Rearmar equipos'}
        </Button>
      </div>

      <div className="grid items-center gap-3 overflow-x-clip py-8 md:grid-cols-[1fr_auto_1fr]">
        <h2
          className="a-slide-left text-center font-display text-4xl uppercase tracking-wider md:text-right md:text-6xl"
          style={{ color: colorA }}
        >
          Equipo A
        </h2>
        <span className="a-vs font-display text-2xl uppercase text-muted md:text-4xl">vs</span>
        <h2
          className="a-slide-right text-center font-display text-4xl uppercase tracking-wider md:text-left md:text-6xl"
          style={{ color: colorB }}
        >
          Equipo B
        </h2>
      </div>

      <p
        className="a-fade-up text-center text-xs uppercase tracking-[0.32em] text-muted"
        style={{ animationDelay: `${REVEAL_DELAY}ms` }}
      >
        Estos son los jugadores
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <TeamColumn color={colorA} players={teams.teamA} />
        <TeamColumn color={colorB} players={teams.teamB} />
      </div>
    </div>
  );
}

function TeamColumn({ color, players }: { color: string; players: TeamPlayer[] }) {
  return (
    <section
      className="a-fade-up rounded-2xl border bg-surface-2/30 p-4"
      style={{
        animationDelay: `${REVEAL_DELAY}ms`,
        borderColor: `${color}55`,
        boxShadow: `0 0 70px -34px ${color}`,
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        {players.map((player, index) => (
          <PlayerCard
            key={player.playerId}
            player={player}
            color={color}
            delay={PLAYERS_DELAY + index * 70}
          />
        ))}
      </div>
    </section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
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
const EXIT_MS = 300;

export function TeamBoard({ teams, onBuild, busy = false }: TeamBoardProps) {
  const built = teams.teamA.length > 0 || teams.teamB.length > 0;

  const [hiding, setHiding] = useState(false);
  const [drawId, setDrawId] = useState(0);
  const wasBusy = useRef(false);
  const pendingReveal = useRef(false);

  useEffect(() => {
    if (wasBusy.current && !busy && pendingReveal.current) {
      pendingReveal.current = false;
      setHiding(false);
      setDrawId((n) => n + 1);
    }
    wasBusy.current = busy;
  }, [busy]);

  const handleRebuild = () => {
    if (busy || hiding) return;
    pendingReveal.current = true;
    setHiding(true);
    window.setTimeout(onBuild, EXIT_MS);
  };

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

  const isRedraw = drawId > 0;
  const revealDelay = isRedraw ? 0 : REVEAL_DELAY;
  const playersDelay = isRedraw ? 60 : PLAYERS_DELAY;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-center gap-2 overflow-x-clip py-5 sm:gap-3 sm:py-8 md:grid-cols-[1fr_auto_1fr]">
        <h2
          className="a-slide-left text-center font-display text-4xl uppercase tracking-wider md:text-right md:text-6xl"
          style={{ color: colorA }}
        >
          Equipo A
        </h2>
        <span className="text-center font-display text-2xl uppercase text-muted md:text-4xl">vs</span>
        <h2
          className="a-slide-right text-center font-display text-4xl uppercase tracking-wider md:text-left md:text-6xl"
          style={{ color: colorB }}
        >
          Equipo B
        </h2>
      </div>

      <p
        className="a-fade-up text-center text-xs uppercase tracking-[0.32em] text-muted"
        style={{ animationDelay: `${revealDelay}ms` }}
      >
        Estos son los jugadores
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <TeamColumn
          color={colorA}
          players={teams.teamA}
          revealDelay={revealDelay}
          playersDelay={playersDelay}
          drawId={drawId}
          hiding={hiding}
        />
        <TeamColumn
          color={colorB}
          players={teams.teamB}
          revealDelay={revealDelay}
          playersDelay={playersDelay}
          drawId={drawId}
          hiding={hiding}
        />
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={handleRebuild} disabled={busy || hiding}>
          {busy || hiding ? 'Rearmando…' : 'Rearmar equipos'}
        </Button>
      </div>
    </div>
  );
}

function TeamColumn({
  color,
  players,
  revealDelay,
  playersDelay,
  drawId,
  hiding,
}: {
  color: string;
  players: TeamPlayer[];
  revealDelay: number;
  playersDelay: number;
  drawId: number;
  hiding: boolean;
}) {
  return (
    <section
      className="a-fade-up rounded-2xl border bg-surface-2/30 p-4"
      style={{
        animationDelay: `${revealDelay}ms`,
        borderColor: `${color}55`,
        boxShadow: `0 0 70px -34px ${color}`,
      }}
    >
      <div key={drawId} className={`grid grid-cols-2 gap-3 ${hiding ? 'a-fade-out' : ''}`}>
        {players.map((player, index) => (
          <PlayerCard
            key={player.playerId}
            player={player}
            color={color}
            delay={playersDelay + index * 70}
          />
        ))}
      </div>
    </section>
  );
}

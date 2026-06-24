import { badgeConfig } from '@/config/badges.config';
import type { TeamPlayer } from '@/services/match.service';

type Level = 1 | 2 | 3 | 4 | 5;
type Accent = 'cyan' | 'magenta' | 'neutral';

function lvl(value?: number): Level {
  return value && value >= 1 && value <= 5 ? (value as Level) : 3;
}

export function PlayerCard({
  player,
  accent = 'neutral',
  delay = 0,
}: {
  player: TeamPlayer;
  accent?: Accent;
  delay?: number;
}) {
  const mobility = badgeConfig.mobility[lvl(player.mobility)];
  const endurance = badgeConfig.endurance[lvl(player.endurance)];
  const bar = accent === 'cyan' ? 'bg-cyan' : accent === 'magenta' ? 'bg-magenta' : 'bg-line';

  return (
    <div
      className="a-pop group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface/80 backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_16px_44px_-20px_rgba(0,0,0,0.9)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`h-1 w-full ${bar} transition group-hover:brightness-150`} />
      <div className="flex flex-1 flex-col justify-between gap-3 p-3">
        <div className="font-display text-xl uppercase leading-none tracking-wide text-white">{player.name}</div>
        <div className="flex items-center gap-2">
          <img
            src={mobility.asset}
            alt={mobility.name}
            title={`Movilidad · ${mobility.name}`}
            className="h-7 w-7 object-contain transition duration-200 group-hover:scale-110"
          />
          <img
            src={endurance.asset}
            alt={endurance.name}
            title={`Resistencia · ${endurance.name}`}
            className="h-7 w-7 object-contain transition duration-200 group-hover:scale-110"
          />
        </div>
      </div>
    </div>
  );
}

import { importConfig } from '@/config/import.config';
import { slugify, disambiguateSlugs } from '@/utils/slug';
import type { PlayerWeight } from '@/entities/player/player.schema';

export type ParsedPlayer = {
  order: number;
  name: string;
  slug: string;
  weight?: PlayerWeight;
};

export type ParsedMatch = {
  title: string;
  location: string;
  date: Date;
};

export type ParseWarning = {
  line: string;
  reason: string;
};

export type ParsedRoster = {
  match: ParsedMatch | null;
  players: ParsedPlayer[];
  warnings: ParseWarning[];
};

const PLAYER_LINE = /^(\d+)\s*-\s*(.+)$/;
const DATE_TIME = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?:\s+(\d{1,2}):(\d{2}))?/;

const WEIGHT_TOKENS: readonly string[] = importConfig.weightTokens;

function normalizeYear(raw: string): number {
  const value = Number(raw);
  return value < 100 ? 2000 + value : value;
}

function parseHeader(line: string, match: RegExpMatchArray, defaultYear: number): ParsedMatch {
  const [, dd, mm, yyyy, hh, min] = match;
  const year = yyyy ? normalizeYear(yyyy) : defaultYear;
  const date = new Date(
    year,
    Number(mm) - 1,
    Number(dd),
    hh ? Number(hh) : 0,
    min ? Number(min) : 0,
    0,
    0,
  );
  const title = line.slice(0, match.index).replace(/[-\s]+$/, '').trim();
  return { title, location: title, date };
}

type RawEntry = { order: number; name: string; weight?: PlayerWeight };

export function parseRosterText(raw: string, defaultYear: number): ParsedRoster {
  const warnings: ParseWarning[] = [];
  const entries: RawEntry[] = [];
  let match: ParsedMatch | null = null;

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const playerMatch = line.match(PLAYER_LINE);
    if (playerMatch) {
      const order = Number(playerMatch[1]);
      const [namePart, ...tokenParts] = playerMatch[2].split(',');
      const name = namePart.trim();
      if (!name) {
        warnings.push({ line, reason: 'empty player name' });
        continue;
      }

      let weight: PlayerWeight | undefined;
      for (const part of tokenParts) {
        const token = part.trim().toLowerCase();
        if (!token) continue;
        if (WEIGHT_TOKENS.includes(token)) {
          weight = token as PlayerWeight;
        } else {
          warnings.push({ line, reason: `unrecognized token: ${token}` });
        }
      }

      entries.push({ order, name, weight });
      continue;
    }

    const dateMatch = line.match(DATE_TIME);
    if (dateMatch && !match) {
      match = parseHeader(line, dateMatch, defaultYear);
      continue;
    }

    warnings.push({ line, reason: 'unrecognized line' });
  }

  const slugs = disambiguateSlugs(entries.map((entry) => slugify(entry.name)));
  const players: ParsedPlayer[] = entries.map((entry, index) => ({
    order: entry.order,
    name: entry.name,
    slug: slugs[index],
    weight: entry.weight,
  }));

  return { match, players, warnings };
}

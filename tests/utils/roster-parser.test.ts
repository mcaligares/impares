import { describe, it, expect } from 'vitest';
import { parseRosterText } from '@/utils/roster-parser';
import { createRosterText } from '../factories/import.factory';

const YEAR = 2026;

describe('parseRosterText', () => {
  it('parses a well-formed list with header', () => {
    const raw = createRosterText(['mati', 'Gonza', 'JP']);
    const result = parseRosterText(raw, YEAR);

    expect(result.players).toHaveLength(3);
    expect(result.players.map((p) => p.name)).toEqual(['mati', 'Gonza', 'JP']);
    expect(result.players[0].slug).toBe('mati');
    expect(result.match?.location).toBe('Futbol Lujan');
  });

  it('parses the header date and time, using the provided default year', () => {
    const result = parseRosterText('Futbol Lujan - 10/06 20:30hs\n1- mati', YEAR);
    const date = result.match?.date;

    expect(date?.getFullYear()).toBe(YEAR);
    expect(date?.getMonth()).toBe(5);
    expect(date?.getDate()).toBe(10);
    expect(date?.getHours()).toBe(20);
    expect(date?.getMinutes()).toBe(30);
  });

  it('tolerates spacing variations around the separator', () => {
    const result = parseRosterText('1- mati\n10 - Nico\n11-migue', YEAR);
    expect(result.players.map((p) => p.name)).toEqual(['mati', 'Nico', 'migue']);
  });

  it('skips blank and unrecognized lines as warnings', () => {
    const result = parseRosterText('Futbol Lujan - 10/06 20:30hs\n\n1- mati\nrandom noise', YEAR);
    expect(result.players).toHaveLength(1);
    expect(result.warnings.some((w) => w.reason === 'unrecognized line')).toBe(true);
  });

  it('maps pluma and tanque weight tokens', () => {
    const result = parseRosterText('11-migue,pluma\n8-Don Carlos,tanque', YEAR);
    expect(result.players[0].weight).toBe('pluma');
    expect(result.players[1].weight).toBe('tanque');
  });

  it('leaves weight undefined when no token is present', () => {
    const result = parseRosterText('2-Gonza', YEAR);
    expect(result.players[0].weight).toBeUndefined();
  });

  it('ignores unknown tokens and records a warning', () => {
    const result = parseRosterText('3-JP,zzz', YEAR);
    expect(result.players[0].weight).toBeUndefined();
    expect(result.warnings.some((w) => w.reason.includes('zzz'))).toBe(true);
  });

  it('disambiguates duplicate names with incremental suffixes', () => {
    const result = parseRosterText('1- Matias\n2- Matias', YEAR);
    expect(result.players.map((p) => p.slug)).toEqual(['matias-1', 'matias-2']);
  });
});

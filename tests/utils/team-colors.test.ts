import { describe, it, expect } from 'vitest';
import { pickTwoColors } from '@/utils/team-colors';

function seq(values: number[]): () => number {
  let i = 0;
  return () => values[i++];
}

describe('pickTwoColors', () => {
  const palette = ['#a', '#b', '#c'];

  it('returns two different palette entries', () => {
    const [a, b] = pickTwoColors(palette, seq([0, 0]));
    expect(a).toBe('#a');
    expect(b).toBe('#b');
    expect(a).not.toBe(b);
  });

  it('shifts the second pick past the first to avoid a collision', () => {
    const [a, b] = pickTwoColors(palette, seq([0.6, 0.6]));
    expect(a).toBe('#b');
    expect(b).toBe('#c');
    expect(a).not.toBe(b);
  });

  it('never returns the same color twice across the range', () => {
    for (const r of [0, 0.34, 0.5, 0.67, 0.99]) {
      const [a, b] = pickTwoColors(palette, seq([r, r]));
      expect(a).not.toBe(b);
    }
  });
});

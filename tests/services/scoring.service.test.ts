import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scorePlayer } from '@/services/scoring.service';

beforeEach(() => vi.clearAllMocks());

describe('scorePlayer', () => {
  it('computes the weighted sum of mobility and endurance', () => {
    expect(scorePlayer({ mobility: 4, endurance: 2 })).toBeCloseTo(4 * 1.0 + 2 * 1.3);
  });

  it('uses the baseline (3) for a missing attribute', () => {
    expect(scorePlayer({ mobility: 5 })).toBeCloseTo(5 * 1.0 + 3 * 1.3);
  });

  it('uses the baseline for every attribute when none are present', () => {
    expect(scorePlayer(null)).toBeCloseTo(3 * 1.0 + 3 * 1.3);
  });

  it('weights endurance more than mobility', () => {
    const enduranceStrong = scorePlayer({ mobility: 1, endurance: 5 });
    const mobilityStrong = scorePlayer({ mobility: 5, endurance: 1 });
    expect(enduranceStrong).toBeGreaterThan(mobilityStrong);
  });
});

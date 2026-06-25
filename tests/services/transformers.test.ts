import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolvePlayerAttributes } from '@/services/transformers';

beforeEach(() => vi.clearAllMocks());

describe('resolvePlayerAttributes', () => {
  it('uses the list value when provided', () => {
    expect(resolvePlayerAttributes({ mobility: 4, endurance: 1 }, null)).toEqual({ mobility: 4, endurance: 1 });
  });

  it('preserves the stored value when the list omits it', () => {
    expect(resolvePlayerAttributes({}, { mobility: 4, endurance: 2 })).toEqual({ mobility: 4, endurance: 2 });
  });

  it('defaults to 3 only when there is neither a list value nor a stored one', () => {
    expect(resolvePlayerAttributes({}, null)).toEqual({ mobility: 3, endurance: 3 });
    expect(resolvePlayerAttributes({ mobility: 5 }, null)).toEqual({ mobility: 5, endurance: 3 });
  });

  it('lets the list value override the stored one', () => {
    expect(resolvePlayerAttributes({ mobility: 2 }, { mobility: 4, endurance: 4 })).toEqual({
      mobility: 2,
      endurance: 4,
    });
  });
});

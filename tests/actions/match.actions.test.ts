import { describe, it, expect } from 'vitest';
import { registerMatchFromText } from '@/actions/match.actions';

describe('registerMatchFromText', () => {
  it('returns an error when the input is empty', async () => {
    const result = await registerMatchFromText('   ');
    expect(result.success).toBe(false);
  });

  it('returns an error when no players can be parsed', async () => {
    const result = await registerMatchFromText('just some random text');
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/No players/);
  });
});

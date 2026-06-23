import type { PlayerWeight } from '@/entities/player/player.schema';

export const parserConfig = {
  weightTokens: ['pluma', 'tanque'] as const satisfies readonly PlayerWeight[],
} as const;

export type WeightToken = (typeof parserConfig.weightTokens)[number];

import type { PlayerWeight } from '@/entities/player/player.schema';

export const importConfig = {
  weightTokens: ['pluma', 'tanque'] as const satisfies readonly PlayerWeight[],
} as const;

export type WeightToken = (typeof importConfig.weightTokens)[number];

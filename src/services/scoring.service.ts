import { scoringConfig } from '@/config/scoring.config';
import type { PlayerAttributes } from '@/entities/player/player.schema';

export function scorePlayer(attributes?: PlayerAttributes | null): number {
  const base = scoringConfig.baselineRating;
  const mobility = attributes?.mobility ?? base;
  const endurance = attributes?.endurance ?? base;
  return mobility * scoringConfig.weights.mobility + endurance * scoringConfig.weights.endurance;
}

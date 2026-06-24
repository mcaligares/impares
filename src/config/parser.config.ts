export const parserConfig = {
  attributeOrder: ['mobility', 'endurance'] as const,
  minRating: 1,
  maxRating: 5,
} as const;

export type AttributeName = (typeof parserConfig.attributeOrder)[number];

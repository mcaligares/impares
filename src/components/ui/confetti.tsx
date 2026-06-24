'use client';

import confetti from 'canvas-confetti';
import { featuresConfig } from '@/config/features.config';

const ARGENTINA = ['#75aadb', '#ffffff', '#f6b40e'];

export function fireConfetti() {
  if (!featuresConfig.worldCupConfetti) return;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  confetti({ particleCount: 140, spread: 90, startVelocity: 45, origin: { y: 0.5 }, colors: ARGENTINA });

  const end = Date.now() + 1400;
  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0 }, colors: ARGENTINA });
    confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1 }, colors: ARGENTINA });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

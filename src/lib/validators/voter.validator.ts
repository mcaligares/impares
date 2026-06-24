import { z } from 'zod';
import { appConfig } from '@/config/app.config';

export const voterNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Poné tu nombre')
    .max(appConfig.voter.nameMaxLength, 'Nombre demasiado largo'),
});

export type VoterNameInput = z.infer<typeof voterNameSchema>;

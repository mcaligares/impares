import { z } from 'zod';
import { appConfig } from '@/config/app.config';

export const guestNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Poné tu nombre')
    .max(appConfig.guest.nameMaxLength, 'Nombre demasiado largo'),
});

export type GuestNameInput = z.infer<typeof guestNameSchema>;

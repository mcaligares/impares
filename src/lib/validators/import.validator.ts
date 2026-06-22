import { z } from 'zod';

export const importTeamSchema = z.object({
  raw: z.string().trim().min(1, 'Paste the players list'),
});

export type ImportTeamFormInput = z.infer<typeof importTeamSchema>;

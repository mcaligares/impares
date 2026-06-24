import { z } from 'zod';

export const plainTeamSchema = z.object({
  raw: z.string().trim().min(1, 'Paste the players list'),
});

export type PlainTeamInput = z.infer<typeof plainTeamSchema>;

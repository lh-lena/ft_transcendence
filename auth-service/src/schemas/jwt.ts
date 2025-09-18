import { z } from 'zod/v4';

export const JwTReturnSchema = z.object({
  id: z.uuid(),
  iat: z.number(),
  exp: z.number(),
});

export type JwTReturnType = z.infer<typeof JwTReturnSchema>;

import { z } from 'zod/v4';

export const JwTPayloadSchema = z.object({
  id: z.uuid(),
  iat: z.number(),
  exp: z.number(),
});

export type JwTPayloadType = z.infer<typeof JwTPayloadSchema>;

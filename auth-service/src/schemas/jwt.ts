import { z } from 'zod/v4';

export const TokenPayloadSchema = z.object({
  id: z.uuid(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type TokenPayloadType = z.infer<typeof TokenPayloadSchema>;

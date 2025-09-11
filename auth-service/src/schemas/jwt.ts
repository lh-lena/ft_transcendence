import { z } from 'zod/v4';

export const TokenPayloadSchema = z.object({
  id: z.uuid(),
  //  username: z.string(),
  //  email: z.email(),
  //  alias: z.string().optional(),
  //  tfaEnabled: z.boolean(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type TokenPayloadType = z.infer<typeof TokenPayloadSchema>;

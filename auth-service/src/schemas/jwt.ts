import { z } from 'zod/v4';

export interface FastifyJwTNamespace {
  sign: (payload: object) => string;
  verify: (token: string) => object;
}

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const JwTReturnSchema = z.object({
  id: z.uuid(),
  role: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export type JwTReturnType = z.infer<typeof JwTReturnSchema>;

import { z } from 'zod';

export const UserSchema = z.object({
  userId: z.number().int(),
  username: z.string().min(1),
  userAlias: z.string().min(1),
});

export type User = z.infer<typeof UserSchema>;

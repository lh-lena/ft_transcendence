import { z } from 'zod/v4';

export const UserIdSchema = z.uuidv4();

export const UserSchema = z.object({
  userId: UserIdSchema,
  username: z.string().min(1),
  userAlias: z.string().min(1),
});

export type User = z.infer<typeof UserSchema>;
export type UserIdType = z.infer<typeof UserIdSchema>;

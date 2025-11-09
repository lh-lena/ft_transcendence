import { z } from 'zod/v4';

export const UserIdSchema = z.uuidv4();

export const UserSchema = z.object({
  userId: UserIdSchema,
  username: z.string().min(1).optional().nullable(),
  userAlias: z.string().min(1).optional().nullable(),
  isAI: z.boolean().optional().default(false),
});

export const UserIdObjectSchema = z.object({
  userId: UserIdSchema,
});

export type User = z.infer<typeof UserSchema>;
export type UserIdType = z.infer<typeof UserIdSchema>;
export type UserIdObject = z.infer<typeof UserIdObjectSchema>;

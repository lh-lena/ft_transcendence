import { z } from 'zod/v4';

export const UserIdSchema = z.uuidv4();

export const UserSchema = z.object({
  userId: UserIdSchema,
  username: z.string().min(1),
  userAlias: z.string().min(1).optional(),
});

export const UserIdObjectSchema = z.object({
  userId: UserIdSchema,
});

export const UserIdJSON = z.toJSONSchema(UserIdObjectSchema as unknown as z.ZodTypeAny, {
  reused: 'ref',
  target: 'draft-7',
  unrepresentable: 'any',
});

export type User = z.infer<typeof UserSchema>;
export type UserIdType = z.infer<typeof UserIdSchema>;
export type UserIdObject = z.infer<typeof UserIdObjectSchema>;

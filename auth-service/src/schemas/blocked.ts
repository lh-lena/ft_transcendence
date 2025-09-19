import { z } from 'zod/v4';
import { dtString } from './basics';

export const blockedSchema = z.object({
  userId: z.uuid(),
  blockedId: z.uuid().optional(),
  createdAt: dtString.optional(),
});
export const blockedArraySchema = z.array(blockedSchema);

export const blockedQuerySchema = blockedSchema;

export const blockedResponseSchema = z.union([blockedSchema, blockedArraySchema, z.string()]);

export type FriendType = z.infer<typeof blockedSchema>;
export type FriendQueryType = z.infer<typeof blockedQuerySchema>;

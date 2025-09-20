import { z } from 'zod/v4';
import { dtString } from './basics';

export const blockedSchema = z.object({
  blockedId: z.number().optional(),
  userId: z.uuid(),
  blockedUserId: z.uuid().optional(),
  createdAt: dtString.optional(),
});

export const blockedIdSchema = z.object({ blockedId: z.coerce.number() });

export const blockedPostSchema = blockedSchema
  .pick({ userId: true })
  .extend({ blockedUserId: z.uuid() });

export const blockedArraySchema = z.array(blockedSchema);

export const blockedQuerySchema = blockedSchema;

export const blockedResponseSchema = z.union([blockedSchema, blockedArraySchema, z.string()]);

export type FriendType = z.infer<typeof blockedSchema>;
export type FriendQueryType = z.infer<typeof blockedQuerySchema>;

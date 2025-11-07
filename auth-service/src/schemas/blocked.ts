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

export type BlockedType = z.infer<typeof blockedSchema>;
export type BlockedIdType = z.infer<typeof blockedIdSchema>;
export type BlockedQueryType = z.infer<typeof blockedQuerySchema>;
export type BlockedPostType = z.infer<typeof blockedPostSchema>;

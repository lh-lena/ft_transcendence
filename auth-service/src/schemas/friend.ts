import { z } from 'zod/v4';
import { dtString } from './basics';

export const friendSchema = z.object({
  friendId: z.number().optional(),
  userId: z.uuid(),
  friendUserId: z.uuid().optional(),
  createdAt: dtString.optional(),
});

export const friendIdSchema = z.object({ friendId: z.coerce.number() });

export const friendPostSchema = friendSchema
  .pick({ userId: true })
  .extend({ friendUserId: z.uuid() });
export const friendArraySchema = z.array(friendSchema);

export const friendQuerySchema = friendSchema;

export const friendResponseSchema = z.union([friendSchema, friendArraySchema, z.string()]);

export type FriendType = z.infer<typeof friendSchema>;
export type FriendIdType = z.infer<typeof friendIdSchema>;
export type FriendQueryType = z.infer<typeof friendQuerySchema>;
export type FriendPostType = z.infer<typeof friendPostSchema>;

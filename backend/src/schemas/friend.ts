import { z } from 'zod/v4';

const friendBase = z.object({
  id: z.number(),
  userId: z.number(),
  friendId: z.number(),
});
const friend = friendBase
  .meta({ $id: 'friend' })
  .describe('A friend relationship. Containes userId(user) and friendId(who is friend)');

const friendCreate = friendBase
  .omit({ id: true })
  .meta({ $id: 'friendCreate' })
  .describe(
    'Create a new friend relationship. Containes userId(user) and friendId(who becomes friend)',
  );

const friendId = friendBase.pick({ id: true }).meta({ $id: 'friendId' });

const friendQuery = friendBase
  .extend({
    id: z.coerce.number().optional(),
    userId: z.coerce.number().optional(),
    friendId: z.coerce.number().optional(),
  })
  .partial()
  .meta({ $id: 'friendQuery' })
  .describe(
    'Query for friend relationships. All fields are optional. Query for userId for all its friends, userId and friendId for relation between two users. Or empty for all friend relationships.',
  );

const friendResponse = friendBase.meta({ $id: 'friendResponse' });
const friendResponseArray = z.array(friendBase).meta({ $id: 'friendResponseArray' });

export const friendSchemas = [
  friend,
  friendId,
  friendCreate,
  friendQuery,
  friendResponse,
  friendResponseArray,
];

export type friendType = z.infer<typeof friend>;
export type friendIdType = z.infer<typeof friendId>;
export type friendCreateType = z.infer<typeof friendCreate>;
export type friendQueryType = z.infer<typeof friendQuery>;
export type friendResponseType = z.infer<typeof friendResponse>;
export type friendResponseArrayType = z.infer<typeof friendResponseArray>;

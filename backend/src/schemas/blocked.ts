import { z } from 'zod/v4';

const blockedBase = z.object({
  id: z.number(),
  userId: z.uuid(),
  blockedId: z.uuid(),
});
const blocked = blockedBase
  .meta({ $id: 'blocked' })
  .describe('A blocked user relationship. Containes userId(user) and blockedId(who is blocked)');

const blockedCreate = blockedBase
  .omit({ id: true })
  .meta({ $id: 'blockedCreate' })
  .describe(
    'Create a new blocked user relationship. Containes userId(user) and blockedId(who is blocked)',
  );

const blockedId = blockedBase.pick({ id: true }).meta({ $id: 'blockedId' });

const blockedQuery = blockedBase
  .extend({ id: z.coerce.number().optional() })
  .partial()
  .meta({ $id: 'blockedQuery' })
  .describe(
    'Query for blocked user relationships. All fields are optional. Query for userId for all its blocked Users, userId and blockedId for realtion between two users. Or empty for all blocked relationships.',
  );

const blockedResponse = blockedBase.omit({ id: true }).meta({ $id: 'blockedResponse' });
const blockedResponseArray = z
  .array(blockedBase.omit({ id: true }))
  .meta({ $id: 'blockedResponseArray' });

export const blockedSchemas = [
  blocked,
  blockedId,
  blockedCreate,
  blockedQuery,
  blockedResponse,
  blockedResponseArray,
];

export type blockedType = z.infer<typeof blocked>;
export type blockedIdType = z.infer<typeof blockedId>;
export type blockedCreateType = z.infer<typeof blockedCreate>;
export type blockedQueryType = z.infer<typeof blockedQuery>;
export type blockedResponseType = z.infer<typeof blockedResponse>;
export type blockedResponseArrayType = z.infer<typeof blockedResponseArray>;

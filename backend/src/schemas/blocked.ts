import { z } from 'zod/v4';

const blockedBase = z.object({
  id: z.number(),
  userId: z.number(),
  blockedId: z.number(),
});
const blocked = blockedBase.meta({ $id: 'blocked' });

const blockedCreate = blockedBase.omit({ id: true }).meta({ $id: 'blockedCreate' });

const blockedId = blockedBase.pick({ id: true }).meta({ $id: 'blockedId' });

const blockedQuery = blockedBase
  .extend({
    id: z.coerce.number().optional(),
    userId: z.coerce.number().optional(),
    blockedId: z.coerce.number().optional(),
  })
  .partial()
  .meta({ $id: 'blockedQuery' });

const blockedResponse = blockedBase.meta({ $id: 'blockedResponse' });
const blockedResponseArray = z.array(blockedBase).meta({ $id: 'blockedResponseArray' });

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

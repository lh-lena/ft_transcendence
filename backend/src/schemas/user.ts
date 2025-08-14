import { z } from 'zod/v4';
import { dtString } from './basics';

import { sharedGamePlayedBase, sharedGamePlayedQueryBase } from './shared';

export const userBase = z.object({
  id: z.number(),
  createdAt: dtString,
  updatedAt: dtString,
  gamePlayed: z.array(sharedGamePlayedBase).optional(),
  email: z.email(),
  username: z.string(),
  password_hash: z.string(),
  is_2fa_enabled: z.boolean().optional(),
  twofa_secret: z.string().nullable().optional(),
});

//define schema for POST
const userPostBase = userBase.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  gamePlayed: true,
});
export const userCreate = userPostBase.meta({ $id: 'userCreate' });

//define schema for PATCH
const userUpdate = userPostBase.partial().meta({ $id: 'userUpdate' });

//define schemas for GET
const userId = z.object({ id: z.number() }).meta({ $id: 'userId' });

export const userQueryBase = userBase
  .extend({
    id: z.coerce.number().optional(),
    gamePlayed: z.object({ some: sharedGamePlayedQueryBase }).optional(),
  })
  .partial();
const userQuery = userQueryBase.meta({ $id: 'userQuery' });

//define schemas for responses
export const userResponse = userBase.meta({ $id: 'userResponse' });
export const userResponseArray = z
  .array(userBase)
  .meta({ $id: 'userResponseArray' });

export const userSchemas = [
  userCreate,
  userUpdate,
  userId,
  userQuery,
  userResponse,
  userResponseArray,
];
//
////export types
export type userType = z.infer<typeof userBase>;
export type userCreateInput = z.infer<typeof userCreate>;
export type userUpdateInput = z.infer<typeof userUpdate>;
export type userQueryInput = z.infer<typeof userQuery>;

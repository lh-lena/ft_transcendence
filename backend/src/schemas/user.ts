import { z } from 'zod/v4';
import { dtString } from './basics';

import { sharedGamePlayedBase, sharedGamePlayedQueryBase } from './shared';

const avatar = z.object({
  color: z.string(),
  colormap: z.array(z.string()),
  avatarUrl: z.url().optional(),
});

export const userBase = z.object({
  id: z.number(),
  createdAt: dtString,
  updatedAt: dtString,
  avatar: avatar.optional(),
  gamePlayed: z.array(sharedGamePlayedBase).optional(),
  email: z.email(),
  username: z.string(),
  password_hash: z.string(),
  is_2fa_enabled: z.boolean().optional(),
  twofa_secret: z.string().nullable().optional(),
});

export const userInfo = userBase.pick({
  id: true,
  username: true,
  avatar: true,
});

//define schema for POST
const userPostBase = userBase.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  gamePlayed: true,
});
export const userCreate = userPostBase.meta({ $id: 'userCreate' }).describe('User creation schema');

//define schema for PATCH
const userUpdate = userPostBase
  .partial()
  .meta({ $id: 'userUpdate' })
  .describe('User update schema');

//define schemas for GET
const userId = z.object({ id: z.number() }).meta({ $id: 'userId' });

export const userQueryBase = userBase
  .extend({
    id: z.coerce.number().optional(),
    gamePlayed: z
      .object({
        some: sharedGamePlayedQueryBase.optional(),
      })
      .optional(),
  })
  .partial();
const userQuery = userQueryBase
  .meta({ $id: 'userQuery' })
  .describe('Query for users with optional filters');

const userCount = z
  .object({
    count: z.number(),
  })
  .meta({ $id: 'userCount' })
  .describe('Count of users');

//define schemas for responses
export const userResponse = userBase.meta({ $id: 'userResponse' });
export const userResponseArray = z.array(userBase).meta({ $id: 'userResponseArray' });

export const userSchemas = [
  userCreate,
  userUpdate,
  userId,
  userCount,
  userQuery,
  userResponse,
  userResponseArray,
];
//
////export types
export type userType = z.infer<typeof userBase>;
export type userCreateType = z.infer<typeof userCreate>;
export type userUpdateType = z.infer<typeof userUpdate>;
export type userQueryType = z.infer<typeof userQuery>;
export type userInfoType = z.infer<typeof userInfo>;

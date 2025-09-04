import { z } from 'zod/v4';
import { dtString } from './basics';

export const userBase = z.object({
  id: z.uuid(),
  createdAt: dtString,
  updatedAt: dtString,
  email: z.email(),
  username: z.string(),
  password_hash: z.string(),
  is_2fa_enabled: z.boolean().optional(),
  twofa_secret: z.string().nullable().optional(),
  guest: z.boolean().default(false),
  color: z.string(),
  colormap: z.array(z.string()).transform((arr) => arr.join(',')),
  avatar: z.url().optional().nullable(),
});

export const userInfo = userBase.pick({
  id: true,
  username: true,
});

//define schema for POST
const userPostBase = userBase.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const userCreate = userPostBase.meta({ $id: 'userCreate' }).describe('User creation schema');

//define schema for PATCH
const userUpdate = userPostBase
  .partial()
  .meta({ $id: 'userUpdate' })
  .describe('User update schema');

const userAvatarUpload = z
  .object({
    id: z.number(),
    avatar: z.string(),
  })
  .meta({ $id: 'userAvatarUpload' });

//define schemas for GET
const userId = userBase.pick({ id: true }).meta({ $id: 'userId' });

export const userQueryBase = userBase.partial();
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
export const userResponse = userBase
  .extend({
    colormap: z.string().transform((str) => str.split(',').filter(Boolean)),
  })
  .meta({ $id: 'userResponse' });
export const userResponseArray = z.array(userBase).meta({ $id: 'userResponseArray' });

export const userSchemas = [
  userCreate,
  userAvatarUpload,
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
export type userAvatarUploadType = z.infer<typeof userAvatarUpload>;
export type userUpdateType = z.infer<typeof userUpdate>;
export type userQueryType = z.infer<typeof userQuery>;
export type userInfoType = z.infer<typeof userInfo>;

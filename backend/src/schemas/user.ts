import { z } from 'zod/v4';
import { dtString } from './basics';

export const userBase = z.object({
  userId: z.uuid(),

  createdAt: dtString,
  updatedAt: dtString,

  email: z.email(),
  username: z.string(),
  alias: z.string().optional(),

  password_hash: z.string(),

  is_2fa_enabled: z.boolean().default(false),
  twofa_secret: z.string().nullable().optional().default(null),
  twofa_method: z.string().nullable().optional().default(null),
  twofa_temp_code: z.string().nullable().optional().default(null),
  twofa_code_expires: dtString.nullable().optional().default(null),

  guest: z.boolean().default(false),

  color: z.string(),
  colormap: z.string(),
  avatar: z.url().optional().nullable(),
});

export const userInfo = userBase.pick({
  userId: true,
  username: true,
  alias: true,
});

//define schema for POST
const userPostBase = userBase.omit({
  userId: true,
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
    userId: z.uuid(),
    avatar: z.string(),
  })
  .meta({ $id: 'userAvatarUpload' });

//define schemas for GET
const userId = userBase.pick({ userId: true }).meta({ $id: 'userId' });

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
export const userResponse = userBase.meta({ $id: 'userResponse' });
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

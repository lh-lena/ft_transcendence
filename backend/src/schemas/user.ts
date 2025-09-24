import { z } from 'zod/v4';
import { dtString, tfaType } from './basics';

export const userBase = z.object({
  userId: z.uuid(),
  githubId: z.string().optional().nullable(),

  createdAt: dtString,
  updatedAt: dtString,

  email: z.email().optional().nullable(),
  username: z.string().optional().nullable(),
  alias: z.string().nullable().optional(),

  online: z.boolean().optional(),

  password_hash: z.string().optional().nullable(),

  tfaEnabled: z.boolean().optional(),
  tfaSecret: z.string().nullable().optional(),
  tfaMethod: tfaType.nullable().optional(),
  tfaTempCode: z.string().nullable().optional(),
  tfaCodeExpires: dtString.nullable().optional(),
  backupCodes: z.string().nullable().optional(),

  guest: z.boolean(),

  color: z.string(),
  colormap: z.string(),
  avatar: z.string().optional().nullable(),
});
export const userBaseArray = z.array(userBase);

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
export const userIdBase = userBase.pick({
  userId: true,
});

const userId = userIdBase.meta({ $id: 'userId' });

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
export type userIdType = z.infer<typeof userId>;
export type userInfoType = z.infer<typeof userIdBase>;
export type userCreateType = z.infer<typeof userCreate>;
export type userAvatarUploadType = z.infer<typeof userAvatarUpload>;
export type userUpdateType = z.infer<typeof userUpdate>;
export type userQueryType = z.infer<typeof userQuery>;

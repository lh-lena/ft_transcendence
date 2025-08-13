import { z } from 'zod/v4';
import { dtString } from './basics';
import {
  gamePlayedBase,
  gamePlayedQueryBase,
  gamePlayedResponseBase,
} from './gamePlayed';

const userIn = {
  email: z.email(),
  username: z.string(),
  password_hash: z.string(),
  is_2fa_enabled: z.boolean().optional(),
  twofa_secret: z.string().nullable().optional(),
};

const userGen = {
  id: z.number(),
  createdAt: dtString,
  updatedAt: dtString,
  gamePlayed: z.array(gamePlayedBase).optional(),
};

export const userBase = z.object({
  ...userGen,
  ...userIn,
});

//define schema for POST
export const userCreateSchema = z
  .object({
    ...userIn,
  })
  .meta({ $id: 'userCreate' });

//define schema for PATCH
const userUpdateSchema = z
  .object({
    ...userIn,
  })
  .partial()
  .meta({ $id: 'userUpdate' });

//define schema for DELETE
const userDeleteSchema = z
  .object({
    message: z.string(),
  })
  .meta({ $id: 'userDelete' });

//define schemas for GET
export const userIdBase = z.object({
  id: z.number(),
});
const userIdSchema = userIdBase.meta({ $id: 'userId' });

const userQueryBase = z.object({
  id: z.coerce.number().optional(),
  email: z.email().optional(),
  username: z.string().optional(),
  is_2fa_enabled: z.boolean().optional(),
  gamePlayed: gamePlayedQueryBase.optional(),
});
const userQuerySchema = userQueryBase.meta({ $id: 'userQuery' });

//define schemas for responses
export const userResponseBase = userBase.extend({
  gamePlayed: z.array(gamePlayedResponseBase).optional(),
});
export const userResponseSchema = userResponseBase.meta({
  $id: 'userResponse',
});

const userResponseArrayBase = z.array(userResponseBase);
export const userResponseArraySchema = userResponseArrayBase.meta({
  $id: 'userResponseArray',
});

//export schemas
export const userSchemas = [
  userCreateSchema,
  userUpdateSchema,
  userDeleteSchema,
  userIdSchema,
  userQuerySchema,
  userResponseSchema,
  userResponseArraySchema,
];

//export types
export type userType = z.infer<typeof userBase>;
export type userCreateInput = z.infer<typeof userCreateSchema>;
export type userUpdateInput = z.infer<typeof userUpdateSchema>;
export type userIdInput = z.infer<typeof userIdSchema>;
export type userQueryInput = z.infer<typeof userQuerySchema>;
export type userResponseType = z.infer<typeof userResponseSchema>;
export type userResponseArrayType = z.infer<typeof userResponseArraySchema>;

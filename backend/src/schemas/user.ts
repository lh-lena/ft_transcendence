import { z } from 'zod/v4';

//define user schema
const userIn = {
  email: z.email(),
  username: z.string(),
  password_hash: z.string(),
  is_2fa_enabled: z.boolean().optional(),
  twofa_secret: z.string().nullable().optional(),
};

const userGen = {
  id: z.number(),
  gamePlayed: z.any().optional(),
  createdAt: z.preprocess(
    (arg) =>
      typeof arg === 'string' || arg instanceof Date
        ? new Date(arg)
        : undefined,
    z.date(),
  ),
  updatedAt: z.preprocess(
    (arg) =>
      typeof arg === 'string' || arg instanceof Date
        ? new Date(arg)
        : undefined,
    z.date(),
  ),
};

export const userBase = z.object({
  ...userGen,
  ...userIn,
});

//define schema for POST
const userCreateSchema = z
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

export const userQueryBase = userBase
  .extend({
    id: z.coerce.number().optional(),
    is_2fa_enabled: z.coerce.boolean().optional(),
  })
  .partial();
const userQuerySchema = userQueryBase.meta({ $id: 'userQuery' });

//define schemas for responses
const userResponseBase = userBase;
const userResponseSchema = userResponseBase.meta({ $id: 'userResponse' });

const userResponseArrayBase = z.array(userResponseBase);
const userResponseArraySchema = userResponseArrayBase.meta({
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
export type user = z.infer<typeof userBase>;
export type userCreateInput = z.infer<typeof userCreateSchema>;
export type userUpdateInput = z.infer<typeof userUpdateSchema>;
export type userIdInput = z.infer<typeof userIdSchema>;
export type userQueryInput = z.infer<typeof userQuerySchema>;

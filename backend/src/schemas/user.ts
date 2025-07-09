import { z }from 'zod/v4';

//userchema

const userIn = {
	email: z.string().email(),
	username: z.string(),
	password_hash: z.string(),
	is_2fa_enabled: z.boolean(),
	twofa_secret: z.string().nullable().optional(),
}

const userGen = {
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
}


const userResponseSchema = z.object( { 
  ...userGen,
  ...userIn,
} ).meta( { $id: "userResponse" } )

const userResponseSchemaArray = z.array(
  userResponseSchema
).meta( { $id: "userResponseArray" } )

const userCreateSchema = z.object( {
  ...userIn,
} ).meta( { $id: "userCreate" } )

const userUpdateSchema = z.object( {
  ...userIn,
} ).meta( { $id: "userUpdate" } )

const userDeleteSchema = z.object( { 
  message: z.string() 
} ).meta( { $id: "userDelete" } )

const userIdSchema = z.object( {
  id: z.string(),
} ).meta( { $id: "userId" } )

const userQuerySchema = z.object( {
  email: z.string().email().optional(),
  username: z.string().optional(),
}).meta( { $id: "userQuery" } )

export type userCreateInput = z.infer< typeof userCreateSchema >;
export type userUpdateInput = z.infer< typeof userUpdateSchema >;
export type userIdInput = z.infer< typeof userIdSchema >;
export type userQueryInput = z.infer< typeof userQuerySchema >;
export type userResponseType = z.infer< typeof userResponseSchema >;
export type userResponseArrayType = z.infer< typeof userResponseSchemaArray >;

export const userSchemas = [
  userCreateSchema,
  userUpdateSchema,
  userDeleteSchema,
  userResponseSchema,
  userResponseSchemaArray,
  userIdSchema,
  userQuerySchema,
]

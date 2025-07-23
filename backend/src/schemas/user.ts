import { z }from 'zod/v4';
import * as basics from './basics.js';

//userchema

const userIn = {
	email: z.string().email(),
	username: z.string(),
	password_hash: z.string(),
	is_2fa_enabled: z.boolean().optional().default( false ),
	twofa_secret: z.string().nullable().optional(),
}

const userGen = {
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
}

const userBase = z.object( { 
  ...userGen,
  ...userIn,
} )

const userSchema = userBase.meta( { $id: "user" } )

export const userBaseArray = z.array( userBase )

const userSchemaArray = userBaseArray.meta( { $id: "userArray" } )

const userCreateSchema = z.object( {
  ...userIn,
} ).meta( { $id: "userCreate" } )

const userUpdateSchema = z.object( {
  ...userIn,
} ).partial().meta( { $id: "userUpdate" } )

const userDeleteSchema = z.object( { 
  message: z.string() 
} ).meta( { $id: "userDelete" } )

export const userIdBase = z.object( {
  id: z.number(),
} )

const userIdSchema = userIdBase.meta( { $id: "userId" } )

const userQuerySchema = userBase.partial().meta( { $id: "userQuery" } )

export type userCreateInput = z.infer< typeof userCreateSchema >;
export type userUpdateInput = z.infer< typeof userUpdateSchema >;
export type userIdInput = z.infer< typeof userIdSchema >;
export type userQueryInput = z.infer< typeof userQuerySchema >;
export type userType = z.infer< typeof userSchema >;
export type userArrayType = z.infer< typeof userSchemaArray >;

export const userSchemas = [
  userCreateSchema,
  userUpdateSchema,
  userDeleteSchema,
  userSchema,
  userSchemaArray,
  userIdSchema,
  userQuerySchema,
]

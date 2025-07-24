import { z } from 'zod/v4';
import * as basics from './basics.js';

//userchema

const userIn = {
	email: z.string().email(),
	username: z.string(),
	password_hash: z.string(),
	is_2fa_enabled: z.boolean().optional(),
	twofa_secret: z.string().nullable().optional(),
}

const userGen = {
  id: z.number(),
  gamePlayed: z.any(),
  created_at: z.string(),
  updated_at: z.string(),
}

export const userBase = z.object( { 
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

export const userQueryBase = userBase.extend({
    id: z.coerce.number().optional(),
    is_2fa_enabled: z.coerce.boolean().optional(),
  }).partial();
const userQuerySchema = userQueryBase.meta( { $id: "userQuery" } );

const userResponseBase = userBase;
const userResponseSchema = userResponseBase.meta( { $id: "userResponse" } )
const userResponseSchemaArray = z.array(userResponseBase).meta( { $id: "userResponseArray" })

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
  userResponseSchema,
  userResponseSchemaArray,
]

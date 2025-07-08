import { z }from "zod";
import { buildJsonSchemas } from "fastify-zod";

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
} );

const userIdSchema = z.object( {
  id: z.number().int(),
 } );

const userQuerySchema = z.object( {
  email: z.string().email().optional(),
  username: z.string().optional(),
});

const userCreateSchema = z.object( {
  ...userIn,
} );

const userUpdateSchema = z.object( {
  ...userIn,
} );

const userDeleteSchema = z.object( { 
  message: z.string() 
} );

export type userCreateInput = z.infer< typeof userCreateSchema >;

export const { schemas: userSchemas, $ref } = buildJsonSchemas( {
  userCreateSchema,
  userUpdateSchema,
  userDeleteSchema,
  userResponseSchema,
  userIdSchema,
  userQuerySchema,
} );

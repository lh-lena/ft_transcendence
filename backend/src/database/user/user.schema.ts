import { z }from "zod";

//userchema

export const userSchema = z.object( { 
  id: z.number().int(),
	email: z.string().email(),
	username: z.string(),
	password_hash: z.string(),
	is_2fa_enabled: z.boolean(),
	twofa_secret: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
} );

export const userIdSchema = z.object( {
  id: z.string().regex(/^\d+$/),
 } );

export const userQuerySchema = z.object( {
  email: z.string().email().optional(),
  username: z.string().optional(),
});

export const CreateuserSchema = z.object( {
  email: z.string().email(),
  username: z.string(),
  password_hash: z.string(),
  is_2fa_enabled: z.boolean().default( false ),
  twofa_secret: z.string().nullable().optional(),
} );

export const UpdateuserSchema = z.object( {
  email: z.string().email().optional(),
  username: z.string().optional(),
  password_hash: z.string().optional(),
  is_2fa_enabled: z.boolean().optional(),
  twofa_secret: z.string().nullable().optional(),
} );

export const ResponseuserSchema = userSchema.omit( {} );

export const DeleteuserSchema = z.object( { 
  message: z.string() 
} );

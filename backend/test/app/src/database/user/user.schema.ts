import { z } from 'zod';

//userchema

export const CreateuserSchema = z.object( { 
	email: z.string().email(),
	username: z.string(),
	password_hash: z.string(),
	is_2fa_enabled: z.boolean().optional(),
	twofa_secret: z.string().optional()
} );

export type CreateuserInput = z.infer<typeof CreateuserSchema>;
export const UpdateuserSchema = CreateuserSchema.partial();

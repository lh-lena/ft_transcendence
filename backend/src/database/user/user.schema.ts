import { z } from 'zod';

//userchema

export const CreateuserSchema = z.object( { 
	email: z.string().email(),
	password_hash: z.string(),
	two_fa_enabled: z.boolean().optional(),
	first_name: z.string().min( 5 ). optional(),
	display_name: z.string().min( 5 ).optional(),
	avatar_url: z.string().url().optional(),
} );

export const UpdateuserSchema = CreateuserSchema.partial();

export type CreateuserInput = z.infer<typeof CreateuserSchema>;

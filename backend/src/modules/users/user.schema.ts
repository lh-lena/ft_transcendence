import { z } from 'zod';

//userschema

export const CreateUserSchema = z.object( { 
	email: z.string().email(),
	password: z.string().min( 10 ),
	two_fa_enabled: z.boolean().optional(),
	first_name: z.string().min( 5 ). optional(),
	display_name: z.string().min( 5 ).optional(),
	avatar_url: z.string().url().optional(),
} );

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

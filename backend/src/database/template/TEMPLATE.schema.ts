import { z } from 'zod';

//TEMPLATEchema

export const CreateTEMPLATESchema = z.object( { 
	email: z.string().email(),
	password_hash: z.string(),
	two_fa_enabled: z.boolean().optional(),
	first_name: z.string().min( 5 ). optional(),
	display_name: z.string().min( 5 ).optional(),
	avatar_url: z.string().url().optional(),
} );

export const UpdateTEMPLATESchema = CreateTEMPLATESchema.partial();

export type CreateTEMPLATEInput = z.infer<typeof CreateTEMPLATESchema>;

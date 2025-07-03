import { z } from 'zod';

//TEMPLATEchema

export const CreateTEMPLATESchema = z.object( { 
} );

export type CreateTEMPLATEInput = z.infer<typeof CreateTEMPLATESchema>;
export const UpdateTEMPLATESchema = CreateTEMPLATESchema.partial();

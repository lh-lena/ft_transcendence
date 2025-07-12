import { z } from 'zod/v4';

const healthSchema = z.object( {
  status: z.string(),
  service: z.string(),
  timestamp: z.string(),
  dbStatus: z.enum( ['up', 'down' ] ),
} ).meta( { $id: 'healthCheck' } );

export const healthSchemas = [
  healthSchema,
]

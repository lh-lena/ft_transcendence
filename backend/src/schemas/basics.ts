import { z } from 'zod/v4';

export const booleanString = z.enum([ 'false', 'true'  ]);

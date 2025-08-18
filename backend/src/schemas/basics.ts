import { z } from 'zod/v4';

export const booleanString = z.enum(['false', 'true']);

export const dtString = z
  .preprocess(
    (arg) => (typeof arg === 'string' || arg instanceof Date ? new Date(arg) : undefined),
    z.date(),
  )
  .transform((date) => date.toISOString());

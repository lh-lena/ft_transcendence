import { z } from 'zod/v4';

export const booleanString = z.enum(['false', 'true']);

export const dtString = z
  .preprocess(
    (arg) => (typeof arg === 'string' || arg instanceof Date ? new Date(arg) : undefined),
    z.date(),
  )
  .transform((date) => date.toISOString())
  .describe('Stores Dates as strings');

export const tfaType = z.enum(['totp', 'email', 'backup']);

//define game status
export const status = z.enum(['waiting', 'ready', 'playing', 'finished']);

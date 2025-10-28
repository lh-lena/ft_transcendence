import { z } from 'zod/v4';

export const booleanString = z.enum(['false', 'true']);

export const dtString = z
  .preprocess(
    (arg) => (typeof arg === 'string' || arg instanceof Date ? new Date(arg) : undefined),
    z.date(),
  )
  .transform((date) => date.toISOString())
  .describe('Stores Dates as strings');

export const tfaType = z.enum(['totp', 'backup']);

//define game status
export const status = z.enum(['waiting', 'ready', 'playing', 'finished']);

interface NormalizedResponse {
  status?: number;
  statusCode?: number;
  data?: unknown;
}

export interface NormalizedError {
  name?: string;
  message: string;
  code?: string;
  status?: number;
  statusCode?: number;
  response?: NormalizedResponse;
  data?: unknown;
  validation?: unknown;
  stack?: string;
}

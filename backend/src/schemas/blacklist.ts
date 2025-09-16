import { z } from 'zod/v4';

export const blacklistSchema = z.object({
  token: z.string(),
});

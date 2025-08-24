import { z } from 'zod';

export const ChatMessagePayloadSchema = z.object({
  userId: z.number(),
  timestamp: z.number().default(() => Date.now()),
});

export type ChatMessagePayload = z.infer<typeof ChatMessagePayloadSchema>;

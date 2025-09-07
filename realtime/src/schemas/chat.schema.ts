import { z } from 'zod/v4';
import { UserIdSchema } from './user.schema.js';

export const ChatMessagePayloadSchema = z.object({
  reciverId: UserIdSchema,
  message: z.string(),
  timestamp: z.string(),
});

export const ChatMessageBroadcastSchema = z.object({
  senderId: UserIdSchema,
  message: z.string(),
  timestamp: z.string(),
});

export const ChatMessageSchema = z.object({
  senderId: UserIdSchema,
  reciverId: UserIdSchema,
  message: z.string(),
});

export type ChatMessagePayload = z.infer<typeof ChatMessagePayloadSchema>;
export type ChatMessageBroadcast = z.infer<typeof ChatMessageBroadcastSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

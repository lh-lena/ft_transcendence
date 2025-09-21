import { z } from 'zod/v4';
import { dtString } from './basics';

export const chatSchema = z.object({
  senderId: z.uuid().optional(),
  reciverId: z.uuid().optional(),
  message: z.string(),
  createdAt: dtString,
});

export const chatQuerySchema = chatSchema.pick({
  senderId: true,
  reciverId: true,
});

export const chatPostSchema = chatSchema.omit({
  createdAt: true,
});

export const chatResponseSchema = chatSchema;
export const chatResponseArraySchema = z.array(chatResponseSchema);

export type ChatType = z.infer<typeof chatSchema>;
export type ChatQueryType = z.infer<typeof chatQuerySchema>;
export type ChatPostType = z.infer<typeof chatPostSchema>;
export type ChatResponseType = z.infer<typeof chatResponseSchema>;
export type ChatResponseArrayType = z.infer<typeof chatResponseArraySchema>;

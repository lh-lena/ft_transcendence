import { userIdSchema } from '../schemas/user';
import {
  chatQuerySchema,
  chatPostSchema,
  chatResponseArraySchema,
  chatResponseSchema,
} from '../schemas/chat';

import type { UserIdType } from '../schemas/user';
import type { ChatQueryType, ChatPostType } from '../schemas/chat';

/**
 * Chat Route Configuration
 * Manages direct messaging between users
 * All chat operations require ownership verification
 */
export const chatRoutesConfig = {
  /**
   * Get Chat Overview
   * Returns summary of all chat conversations for a user
   * @requires Authentication
   * @param userId - Must match authenticated user ID
   * @returns Array of chat overviews with last message, unread count, etc.
   */
  getOverview: {
    method: 'get' as const,
    url: (params: UserIdType) => `/chat/overview/${params.userId}`,
    paramsSchema: userIdSchema,
    responseSchema: chatResponseArraySchema,
    checkOwnership: async (data: { params?: UserIdType }, userId: string) => {
      return data.params?.userId === userId;
    },
    successCode: 200,
    errorMessages: {
      invalidParams: 'Invalid user ID',
      forbidden: 'Forbidden: You can only see your own chats',
    },
  },

  /**
   * Get Chat Messages
   * Retrieves messages between two users
   * @requires Authentication
   * @param query.senderId - One participant's user ID
   * @param query.receiverId - Other participant's user ID
   * @returns Array of chat messages
   */
  getChats: {
    method: 'get' as const,
    url: '/chat',
    querySchema: chatQuerySchema,
    responseSchema: chatResponseArraySchema,
    checkOwnership: async (data: { query?: ChatQueryType }, userId: string) => {
      return data.query?.senderId === userId || data.query?.recieverId === userId;
    },
    successCode: 200,
    errorMessages: {
      invalidQuery: 'Invalid query parameters',
      forbidden: 'Forbidden: You can only see your own chats',
    },
  },

  /**
   * Send Chat Message
   * Creates a new chat message
   * @requires Authentication
   * @param body.senderId - Must match authenticated user ID
   * @param body.receiverId - Recipient user ID
   * @param body.message - Message content
   * @returns 201 - Message created successfully
   */
  createChat: {
    method: 'post' as const,
    url: '/chat',
    bodySchema: chatPostSchema,
    responseSchema: chatResponseSchema,
    checkOwnership: async (data: { body?: ChatPostType }, userId: string) => {
      if (data.body?.senderId === data.body?.recieverId) return false;
      return data.body?.senderId === userId;
    },
    successCode: 201,
    errorMessages: {
      invalidBody: 'Invalid chat body',
      forbidden: 'Forbidden',
    },
  },
};

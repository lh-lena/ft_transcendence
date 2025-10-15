import { userIdSchema } from '../schemas/user';
import {
  chatQuerySchema,
  chatPostSchema,
  chatResponseArraySchema,
  chatResponseSchema,
} from '../schemas/chat';

import type { UserIdType } from '../schemas/user';
import type { ChatQueryType, ChatPostType } from '../schemas/chat';

export const chatRoutesConfig = {
  getOverview: {
    method: 'get' as const,
    url: (params: UserIdType) => `/chat/overview/${params.userId}`,
    paramsSchema: userIdSchema,
    responseSchema: chatResponseArraySchema,
    checkOwnership: async (data: { params?: UserIdType }, userId: string) => {
      return data.params?.userId === userId;
    },
    errorMessages: {
      invalidParams: 'Invalid user ID',
      forbidden: 'Forbidden: You can only see your own chats',
    },
  },

  getChats: {
    method: 'get' as const,
    url: '/chat',
    querySchema: chatQuerySchema,
    responseSchema: chatResponseArraySchema,
    checkOwnership: async (data: { query?: ChatQueryType }, userId: string) => {
      return data.query?.senderId === userId || data.query?.recieverId === userId;
    },
    errorMessages: {
      invalidQuery: 'Invalid query parameters',
      forbidden: 'Forbidden: You can only see your own chats',
    },
  },

  createChat: {
    method: 'post' as const,
    url: '/chat',
    bodySchema: chatPostSchema,
    responseSchema: chatResponseSchema,
    checkOwnership: async (data: { body?: ChatPostType }, userId: string) => {
      return data.body?.senderId === userId;
    },
    errorMessages: {
      invalidBody: 'Invalid chat body',
      forbidden: 'Forbidden: You can only send messages as yourself',
    },
  },
};

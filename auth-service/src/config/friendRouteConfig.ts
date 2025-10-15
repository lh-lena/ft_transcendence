import { FastifyInstance } from 'fastify';
import { AxiosRequestConfig } from 'axios';

import {
  friendQuerySchema,
  friendPostSchema,
  friendResponseSchema,
  friendIdSchema,
} from '../schemas/friend';
import type { FriendIdType, FriendQueryType, FriendPostType } from '../schemas/friend';

//Configs for friendRoutes
export const friendRoutesConfig = {
  //get friend by query
  getFriend: {
    method: 'get' as const,
    url: '/friend',
    querySchema: friendQuerySchema,
    checkOwnership: (data: { query?: FriendQueryType }, userId: string) => {
      return data.query?.userId === userId;
    },
    responseSchema: friendResponseSchema,
    errorMessages: {
      invalidQuery: 'Invalid query',
      forbidden: 'Forbidden',
    },
  },

  createFriend: {
    method: 'post' as const,
    url: '/friend',
    bodySchema: friendPostSchema,
    checkOwnership: (data: { body?: FriendPostType }, userId: string) => {
      return data.body?.userId === userId;
    },
    responseSchema: friendResponseSchema,
    successCode: 201,
    errorMessages: {
      invalidBody: 'Invalid body',
      forbidden: 'Forbidden',
    },
  },

  deleteFriend: {
    method: 'delete' as const,
    url: (params: FriendIdType) => `/friend/${params.friendId}`,
    paramsSchema: friendIdSchema,
    checkOwnership: async (
      data: { params?: FriendIdType },
      userId: string,
      server: FastifyInstance,
    ) => {
      if (!data.params?.friendId) return false;

      const config: AxiosRequestConfig = {
        method: 'get',
        url: '/friend',
        params: { friendId: data.params.friendId },
      };

      const friendCheck = await server.api(config);

      return friendCheck.length === 1 && friendCheck[0].userId === userId;
    },
    errorMessages: {
      invalidParams: 'Invalid input parameters',
      forbidden: 'Forbidden',
    },
  },
};

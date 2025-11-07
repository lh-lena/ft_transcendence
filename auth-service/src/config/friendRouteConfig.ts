import { FastifyInstance } from 'fastify';
import { AxiosRequestConfig } from 'axios';

import {
  friendQuerySchema,
  friendPostSchema,
  friendResponseSchema,
  friendIdSchema,
} from '../schemas/friend';
import type { FriendIdType, FriendQueryType, FriendPostType } from '../schemas/friend';

/**
 * Friend Relationship Route Configuration
 * Manages friend connections between users
 * All operations require ownership verification to prevent unauthorized relationship manipulation
 */
export const friendRoutesConfig = {
  /**
   * Get Friend Relationships
   * Retrieves friend list for a user
   * @requires Authentication
   * @param query.userId - Must match authenticated user ID
   * @returns Array of friend relationships
   */
  getFriend: {
    method: 'get' as const,
    url: '/friend',
    querySchema: friendQuerySchema,
    checkOwnership: (data: { query?: FriendQueryType }, userId: string) => {
      return data.query?.userId === userId;
    },
    responseSchema: friendResponseSchema,
    successCode: 200,
    errorMessages: {
      invalidQuery: 'Invalid query',
      forbidden: 'Forbidden',
    },
  },

  /**
   * Create Friend Relationship
   * Sends or accepts a friend request
   * @requires Authentication
   * @param body.userId - Must match authenticated user ID
   * @param body.friendId - User ID to befriend
   * @returns 201 - Friend relationship created
   */
  createFriend: {
    method: 'post' as const,
    url: '/friend',
    bodySchema: friendPostSchema,
    checkOwnership: (data: { body?: FriendPostType }, userId: string) => {
      if (data.body?.userId === data.body?.friendUserId) return false;
      return data.body?.userId === userId;
    },
    responseSchema: friendResponseSchema,
    successCode: 201,
    errorMessages: {
      invalidBody: 'Invalid body',
      forbidden: 'Forbidden',
    },
  },

  /**
   * Remove Friend Relationship
   * Deletes an existing friendship
   * @requires Authentication & Ownership
   * @param friendId - ID of the friendship to remove
   * @returns 204 - Friendship removed successfully
   */
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
    successCode: 204,
    errorMessages: {
      invalidParams: 'Invalid input parameters',
      forbidden: 'Forbidden',
    },
  },
};

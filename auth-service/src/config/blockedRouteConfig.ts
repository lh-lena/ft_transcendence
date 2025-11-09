import { FastifyInstance } from 'fastify';
import { AxiosRequestConfig } from 'axios';

import {
  blockedQuerySchema,
  blockedPostSchema,
  blockedResponseSchema,
  blockedIdSchema,
} from '../schemas/blocked';
import type { BlockedIdType, BlockedQueryType, BlockedPostType } from '../schemas/blocked';

/**
 * Blocked Users Route Configuration
 * Manages user blocking functionality for privacy and safety
 * All operations require ownership verification
 */
export const blockedRoutesConfig = {
  /**
   * Get Blocked Users
   * Retrieves list of users blocked by the authenticated user
   * @requires Authentication
   * @param query.userId - Must match authenticated user ID
   * @returns Array of blocked user relationships
   */
  getBlocked: {
    method: 'get' as const,
    url: '/blocked',
    querySchema: blockedQuerySchema,
    checkOwnership: (data: { query?: BlockedQueryType }, userId: string) => {
      return data.query?.userId === userId;
    },
    responseSchema: blockedResponseSchema,
    errorMessages: {
      invalidQuery: 'Invalid query',
      forbidden: 'Forbidden',
    },
  },

  /**
   * Block a User
   * Creates a new block relationship
   * @requires Authentication
   * @param body.userId - Must match authenticated user ID
   * @returns 201 - Block created successfully
   */
  createBlocked: {
    method: 'post' as const,
    url: '/blocked',
    bodySchema: blockedPostSchema,
    checkOwnership: (data: { body?: BlockedPostType }, userId: string) => {
      if (data.body?.userId === data.body?.blockedUserId) return false;
      return data.body?.userId === userId;
    },
    responseSchema: blockedResponseSchema,
    successCode: 201,
    errorMessages: {
      invalidBody: 'Invalid body',
      forbidden: 'Forbidden',
    },
  },

  /**
   * Unblock a User
   * Removes an existing block relationship
   * @requires Authentication & Ownership
   * @param blockedId - ID of the block relationship to remove
   * @returns 204 - Block removed successfully
   */
  deleteBlocked: {
    method: 'delete' as const,
    url: (params: BlockedIdType) => `/blocked/${params.blockedId}`,
    paramsSchema: blockedIdSchema,
    checkOwnership: async (
      data: { params?: BlockedIdType },
      userId: string,
      server: FastifyInstance,
    ) => {
      if (!data.params?.blockedId) {
        server.log.warn('Missing blockedId in delete request');
        return false;
      }

      try {
        const config: AxiosRequestConfig = {
          method: 'get',
          url: '/blocked',
          params: { blockedId: data.params.blockedId },
        };

        const blockedCheck = await server.api(config);

        if (!Array.isArray(blockedCheck) || blockedCheck.length !== 1) {
          server.log.warn({ blockedId: data.params.blockedId }, 'Block relationship not found');
          return false;
        }
        return blockedCheck[0].userId === userId;
      } catch (error) {
        server.log.error(
          { error, blockedId: data.params.blockedId },
          'Failed to verify block ownership',
        );
        return false;
      }
    },
    successCode: 204,
    errorMessages: {
      invalidParams: 'Invalid input parameters',
      forbidden: 'Forbidden',
    },
  },
};

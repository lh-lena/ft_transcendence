import { FastifyInstance } from 'fastify';
import { AxiosRequestConfig } from 'axios';

import {
  blockedQuerySchema,
  blockedPostSchema,
  blockedResponseSchema,
  blockedIdSchema,
} from '../schemas/blocked';
import type { BlockedIdType, BlockedQueryType, BlockedPostType } from '../schemas/blocked';

//Configs for blockedRoutes
export const blockedRoutesConfig = {
  //get blocked by query
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

  createBlocked: {
    method: 'post' as const,
    url: '/blocked',
    bodySchema: blockedPostSchema,
    checkOwnership: (data: { body?: BlockedPostType }, userId: string) => {
      return data.body?.userId === userId;
    },
    responseSchema: blockedResponseSchema,
    successCode: 201,
    errorMessages: {
      invalidBody: 'Invalid body',
      forbidden: 'Forbidden',
    },
  },

  deleteBlocked: {
    method: 'delete' as const,
    url: (params: BlockedIdType) => `/blocked/${params.blockedId}`,
    paramsSchema: blockedIdSchema,
    checkOwnership: async (
      data: { params?: BlockedIdType },
      userId: string,
      server: FastifyInstance,
    ) => {
      if (!data.params?.blockedId) return false;

      const config: AxiosRequestConfig = {
        method: 'get',
        url: '/blocked',
        params: { blockedId: data.params.blockedId },
      };

      const blockedCheck = await server.api(config);

      return blockedCheck.length === 1 && blockedCheck[0].userId === userId;
    },
    errorMessages: {
      invalidParams: 'Invalid input parameters',
      forbidden: 'Forbidden',
    },
  },
};

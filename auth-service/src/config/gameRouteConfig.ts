import { FastifyInstance } from 'fastify';
import { AxiosRequestConfig } from 'axios';

import { gameIdSchema, gamePostSchema, gameJoinSchema, gameResponseSchema } from '../schemas/game';

import type { GameIdType, GamePostType, GameJoinType } from '../schemas/game';

export const gameRoutesConfig = {
  getGame: {
    method: 'get' as const,
    url: (params: GameIdType) => `/game/${params.gameId}`,
    paramsSchema: gameIdSchema,
    responseSchema: gameResponseSchema,
    successCode: 200,
    errorMessages: {
      invalidParams: 'Invalid game ID',
    },
  },

  createGame: {
    method: 'post' as const,
    url: `/game`,
    bodySchema: gamePostSchema,
    responseSchema: gameResponseSchema,
    checkOwnership: async (data: { body?: GamePostType }, userId: string) => {
      return data.body?.userId === userId;
    },
    successCode: 201,
    errorMessages: {
      invalidBody: 'Invalid game Data',
      forbidden: 'Forbidden',
    },
  },

  joinGame: {
    method: 'post' as const,
    url: `/game/join`,
    bodySchema: gameJoinSchema,
    responseSchema: gameResponseSchema,
    checkOwnership: async (data: { body?: GameJoinType }, userId: string) => {
      return data.body?.userId === userId;
    },
    successCode: 201,
    errorMessages: {
      invalidBody: 'Invalid game join Data',
      forbidden: 'Forbidden',
    },
  },

  deleteGame: {
    method: 'delete' as const,
    url: (params: GameIdType) => `/game/${params.gameId}`,
    paramsSchema: gameIdSchema,
    checkOwnership: async (
      data: { params?: GameIdType },
      userId: string,
      server: FastifyInstance,
    ) => {
      if (!data.params?.gameId) return false;

      const config: AxiosRequestConfig = {
        method: 'get',
        url: '/game',
        params: { gameId: data.params.gameId },
      };

      const gameCheck = await server.api(config);

      return gameCheck.userId === userId;
    },
    successCode: 204,
    errorMessages: {
      invalidParams: 'Invalid game ID',
      forbidden: 'Forbidden: Only delete one of your games',
    },
  },
};

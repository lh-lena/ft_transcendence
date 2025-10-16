import { FastifyInstance } from 'fastify';
import { AxiosRequestConfig } from 'axios';

import { gameIdSchema, gamePostSchema, gameJoinSchema, gameResponseSchema } from '../schemas/game';

import type { GameType, GameIdType, GamePostType, GameJoinType } from '../schemas/game';

/**
 * Game Route Configuration
 * Manages game lobbies and matchmaking
 * Handles game creation, joining, and deletion
 */
export const gameRoutesConfig = {
  /**
   * Get Game Details
   * Retrieves information about a specific game
   * @param gameId - Unique game identifier
   * @returns Game object with players, status, settings, etc.
   */
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

  /**
   * Create Game
   * Creates a new game lobby
   * @requires Authentication
   * @param body.userId - Must match authenticated user ID (game creator)
   * @param body.settings - Game configuration
   * @returns 201 - Game created successfully
   */
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

  /**
   * Join Game
   * Adds authenticated user to an existing game lobby
   * @requires Authentication
   * @param body.userId - Must match authenticated user ID
   * @param body.gameId - Game to join
   * @returns 200 - Successfully joined game
   */
  joinGame: {
    method: 'post' as const,
    url: `/game/join`,
    bodySchema: gameJoinSchema,
    responseSchema: gameResponseSchema,
    checkOwnership: async (data: { body?: GameJoinType }, userId: string) => {
      return data.body?.userId === userId;
    },
    successCode: 200,
    errorMessages: {
      invalidBody: 'Invalid game join Data',
      forbidden: 'Forbidden',
    },
  },

  /**
   * Delete Game
   * Removes a game lobby (only creator can delete)
   * @requires Authentication & Ownership
   * @param gameId - Game to delete
   * @returns 204 - Game deleted successfully
   */
  deleteGame: {
    method: 'delete' as const,
    url: (params: GameIdType) => `/game/${params.gameId}`,
    paramsSchema: gameIdSchema,
    checkOwnership: async (
      data: { params?: GameIdType },
      userId: string,
      server: FastifyInstance,
    ) => {
      if (!data.params?.gameId) {
        server.log.warn('Missing gameId in delete request');
        return false;
      }

      try {
        const config: AxiosRequestConfig = {
          method: 'get',
          url: `/game/${data.params.gameId}`, // Use URL param instead of query
        };

        const gameCheck: GameType = await server.api(config);

        if (!gameCheck) {
          server.log.warn({ gameId: data.params.gameId }, 'Game not found');
          return false;
        }

        return gameCheck.players.some((p) => p.userId === userId);
      } catch (error) {
        server.log.error({ error, gameId: data.params.gameId }, 'Failed to verify game ownership');
        return false;
      }
    },
    successCode: 204,
    errorMessages: {
      invalidParams: 'Invalid game ID',
      forbidden: 'Forbidden: Only delete one of your games',
    },
  },
};

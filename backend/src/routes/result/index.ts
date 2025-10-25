/**
 * Result Routes
 *
 * Provides game result management and statistics endpoints.
 *
 * @module routes/result
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import crudRoutes from '../../utils/crudRoutes';

import type { resultQueryType, resultCreateType, resultIdType } from '../../schemas/result';

import type { userIdType } from '../../schemas/user';

/**
 * Result Routes Plugin
 *
 * @param server - Fastify server instance
 */
const resultRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<resultQueryType, resultCreateType, null, resultIdType>(), {
    basePath: '/',
    entityName: 'result',
    routes: ['getQuery', 'create'],
  });

  /**
   * Player Statistics Endpoint
   */
  server.get('/stats/:userId', {
    schema: {
      summary: 'Get wins and losses by user ID',
      description: 'Endpoint to get win/loss statistics for a player',
      tags: ['result'],
      params: { $ref: 'userId' },
      response: {
        200: { $ref: 'resultWinsLoses' },
        404: { $ref: 'NotFound' },
        500: { $ref: 'InternalError' },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as userIdType;
      const statistics = await server.services.result.getWinsLoses({ userId: params.userId });

      return reply.code(200).send(statistics);
    },
  });

  /**
   * Leaderboard Endpoint
   */
  server.get('/leaderboard', {
    schema: {
      summary: 'Get leaderboard',
      description: `Endpoint to get the top ${server.config.LEADERBOARD_SIZE} players`,
      tags: ['result'],
      response: {
        200: { $ref: 'leaderboard' },
        500: { $ref: 'InternalError' },
      },
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      const leaderboard = await server.services.result.getLeaderboard();

      return reply.code(200).send(leaderboard);
    },
  });
};

export default resultRoutes;

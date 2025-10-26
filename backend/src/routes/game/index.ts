/**
 * Game Routes
 *
 * Provides game management endpoints.
 *
 * @module routes/game
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import crudRoutes from '../../utils/crudRoutes';

import type { gameCreateType, gameJoinType, gameIdType } from '../../schemas/game';

/**
 * Game Routes Plugin
 *
 * @param server - Fastify server instance
 */
const gameRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<null, gameCreateType, null, gameIdType>(), {
    basePath: '/',
    entityName: 'game',
    routes: ['getById', 'create', 'delete'],
  });

  /**
   * Join Game
   */
  server.post('/join', {
    schema: {
      summary: 'Join a random or private game',
      description:
        'Join a specific game by providing gameId, or get matched to a random available game.',
      tags: ['game'],
      body: { $ref: 'gameJoin' },
      response: {
        200: { $ref: 'gameResponse' },
        400: { $ref: 'BadRequest' },
        404: { $ref: 'NotFound' },
        500: { $ref: 'InternalError' },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as gameJoinType;
      const result = await server.services.game.join(body);

      return reply.code(200).send(result);
    },
  });
};

export default gameRoutes;

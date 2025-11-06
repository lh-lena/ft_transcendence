/**
 * Tournament Routes
 *
 * Provides tournament management endpoints.
 *
 * @module routes/tournament
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import crudRoutes from '../../utils/crudRoutes';

import type { tournamentCreateType, tournamentIdType } from '../../schemas/tournament';
import type { userIdType } from '../../schemas/user';

/**
 * Tournament Routes Plugin
 *
 * @param server - Fastify server instance
 */
const tournamentRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<null, tournamentCreateType, null, tournamentIdType>(), {
    basePath: '/',
    entityName: 'tournament',
    routes: ['getById', 'create'],
  });

  /**
   * Leave Tournament Endpoint
   */
  server.delete('/leave/:userId', {
    schema: {
      summary: 'Leave a tournament',
      description: 'Allows a user to leave a tournament they have joined.',
      tags: ['tournament'],
      params: { $ref: 'userId' },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        400: { $ref: 'BadRequest' },
        500: { $ref: 'InternalError' },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as userIdType;
      const result = await server.services.tournament.leave({ userId: params.userId });

      const message = result ? 'Successfully left tournament' : 'Not currently in any tournament';

      return reply.code(200).send({ message });
    },
  });
};

export default tournamentRoutes;

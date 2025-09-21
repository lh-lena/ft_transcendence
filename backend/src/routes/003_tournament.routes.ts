import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { tournamentController } from '../modules/tournament/tournament.controller';
import type { tournamentType, tournamentCreateType, tournamentIdType } from '../schemas/tournament';
import { userIdType } from '../schemas/user';

const tournamentRoutes = async (server: FastifyInstance) => {
  server.register(
    crudRoutes<tournamentType, null, tournamentCreateType, null, tournamentIdType>(),
    {
      basePath: '/api/tournament',
      entityName: 'tournament',
      controller: tournamentController,
      routes: ['getById', 'create'],
    },
  );
  server.post('/api/tournament/leave/:userId', {
    schema: {
      summary: 'Leave a tournament',
      description: 'Allows a user to leave a tournament they have joined.',
      tgs: ['tournament'],
      params: { $ref: 'userId' },
      response: {
        200: { message: String },
      },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const userId = req.params as userIdType;

      const ret = await tournamentController.leave(userId);

      return reply.code(200).send(ret);
    },
  });
};

export default fp(tournamentRoutes);

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';
import { gameController } from '../modules/game/game.controller';

import { gameType, gameCreateType, gameJoinType } from '../schemas/game';

const gameRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<gameType, null, gameCreateType, null, string>(), {
    basePath: '/api/game',
    entityName: 'game',
    controller: gameController,
    routes: ['getById', 'create'],
  });

  server.post('/api/game/join', {
    schema: {
      summary: 'Join a random or private game',
      description:
        'Endpoint to join a game. If gameId provided you join this game if possible. Otherwise player get joined random game',
      tags: ['game'],
      body: { $ref: 'gameJoin' },
      response: {
        200: { $ref: 'gameResponse' },
      },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as gameJoinType;
      const ret = await gameController.join(body);

      return reply.code(200).send(ret);
    },
  });
};

export default fp(gameRoutes);

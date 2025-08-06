import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { Update } from '../utils/crudDefines';

import crudRoutes from '../utils/crudRoutes';
import { gameController } from '../modules/game/game.controller';

import {
  game,
  gameQueryInput,
  gameCreateInput,
  gameIdInput,
} from '../schemas/game';

const gameRoutes = async (server: FastifyInstance) => {
  server.register(
    crudRoutes<game, gameQueryInput, gameCreateInput, gameIdInput>(),
    {
      basePath: '/api/game',
      entityName: 'game',
      controller: gameController,
      routes: ['getAll', 'getById', 'create'],
    },
  );

  server.post('/api/game/join/:id', {
    schema: {
      params: { $ref: 'gameId' },
      body: { $ref: 'gameCreate' },
      response: {
        200: { $ref: 'gameResponse' },
        404: { $ref: 'NotFound' },
      },
      summary: 'Join a private game',
    },
    handler: async (
      request: FastifyRequest<Update<gameIdInput, gameCreateInput>>,
      reply: FastifyReply,
    ) => {
      const id = request.params.id;
      const body = request.body as gameCreateInput;
      const ret = await gameController.join(id, body);

      return reply.code(200).send(ret);
    },
  });
};

export default fp(gameRoutes);

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { matchRefSchemas } from '../modules/match/match.schema';
import { matchController } from '../modules/match/match.controller';

import { responseRefSchemas } from '../modules/response/response.schema';

const matchRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes, {
    basePath: '/api/match',
    entityName: 'match',
    controller: matchController,
  });

  server.post('/api/match/join/:id', {
    schema: {
      params: { $ref: 'matchId' },
      body: { $ref: 'matchCreate' },
      response: {
        200: { $ref: 'matchResponse' },
        404: { $ref: 'NotFound' },
      },
      summary: 'Join a private match',
    },
    handler: async (request, reply) => {
      const ret = await matchController.join(request.params.id, request.body);

      return reply.code(200).send(ret);
    },
  });
};

export default fp(matchRoutes);

import { FastifyInstance, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';
import { resultController } from '../modules/result/result.controller';

import { resultType, resultQueryType, resultCreateType } from '../schemas/result';

const resultRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<resultType, resultQueryType, resultCreateType, null, number>(), {
    basePath: '/api/result',
    entityName: 'result',
    controller: resultController,
    routes: ['getQuery', 'getById', 'create'],
  });

  server.get('/api/result/leaderboard', {
    schema: {
      response: {
        200: { $ref: 'leaderboard' },
      },
      summary: 'Get leaderboard',
    },
    handler: async (_, reply: FastifyReply) => {
      const ret = await resultController.getLeaderboard();

      return reply.code(200).send(ret);
    },
  });
};

export default fp(resultRoutes);

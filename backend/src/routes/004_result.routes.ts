import { FastifyInstance, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';
import { resultController } from '../modules/result/result.controller';

import {
  resultResponseType,
  resultQueryType,
  resultCreateType,
  resultIdType,
} from '../schemas/result';

const resultRoutes = async (server: FastifyInstance) => {
  server.register(
    crudRoutes<resultResponseType, resultQueryType, resultCreateType, null, resultIdType>(),
    {
      basePath: '/api/result',
      entityName: 'result',
      controller: resultController,
      routes: ['getQuery', 'getById', 'create'],
    },
  );

  server.get('/api/result/leaderboard', {
    schema: {
      summary: 'Get leaderboard',
      description: 'Endpoint to get the five best registered Players',
      tags: ['result'],
      response: {
        200: { $ref: 'leaderboard' },
      },
    },
    handler: async (_, reply: FastifyReply) => {
      const ret = await resultController.getLeaderboard();

      return reply.code(200).send(ret);
    },
  });
};

export default fp(resultRoutes);

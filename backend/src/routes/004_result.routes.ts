import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';
import { resultController } from '../modules/result/result.controller';

import type {
  resultResponseType,
  resultQueryType,
  resultCreateType,
  resultIdType,
} from '../schemas/result';

import type { userIdType } from '../schemas/user';

const resultRoutes = async (server: FastifyInstance) => {
  server.get('/api/result/stats/:userId', {
    schema: {
      summary: 'Get wins and loses by userId',
      description: 'Endpoint to get the history of wins and loses for resgistered Players',
      tags: ['result'],
      params: { $ref: 'userId' },
      response: {
        200: { $ref: 'resultWinsLoses' },
      },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const userId = req.params as userIdType;
      const ret = await resultController.getWinsLoses(userId);

      return reply.code(200).send(ret);
    },
  });

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

  server.register(
    crudRoutes<resultResponseType, resultQueryType, resultCreateType, null, resultIdType>(),
    {
      basePath: '/api/result',
      entityName: 'result',
      controller: resultController,
      routes: ['getQuery', 'create'],
    },
  );
};

export default fp(resultRoutes);

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';
import { resultController } from '../modules/result/result.controller';

import {
  resultType,
  resultQueryType,
  resultCreateType,
} from '../schemas/result';

const resultRoutes = async (server: FastifyInstance) => {
  server.register(
    crudRoutes<resultType, resultQueryType, resultCreateType, null, number>(),
    {
      basePath: '/api/result',
      entityName: 'result',
      controller: resultController,
      routes: ['getQuery', 'getById', 'create'],
    },
  );
};

export default fp(resultRoutes);

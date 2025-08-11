import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';
import { resultController } from '../modules/result/result.controller';

import {
  resultResponseType,
  resultQueryInput,
  resultCreateInput,
  resultIdInput,
} from '../schemas/result';

const resultRoutes = async (server: FastifyInstance) => {
  server.register(
    crudRoutes<
      resultResponseType,
      resultQueryInput,
      resultCreateInput,
      null,
      resultIdInput
    >(),
    {
      basePath: '/api/result',
      entityName: 'result',
      controller: resultController,
      routes: ['getAll', 'getById', 'create'],
    },
  );
};

export default fp(resultRoutes);

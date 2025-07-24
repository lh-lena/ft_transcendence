import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { resultRefSchemas } from '../modules/result/result.schema';
import { resultController } from '../modules/result/result.controller';

import { responseRefSchemas } from '../modules/response/response.schema';

const resultRoutes = async ( server: FastifyInstance ) => {
  
  server.register( crudRoutes, {
    basePath: '/api/result',
    entityName: 'result',
    controller: resultController,
    routes: [ 'getAll', 'getById', 'create' ],
  });

}

export default fp( resultRoutes );

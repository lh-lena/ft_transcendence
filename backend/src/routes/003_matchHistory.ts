import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { matchHistoryRefSchemas } from '../modules/matchHistory/matchHistory.schema';
import { matchHistoryController } from '../modules/matchHistory/matchHistory.controller';

import { responseRefSchemas } from '../modules/response/response.schema';

const matchHistoryRoutes = async ( server: FastifyInstance ) => {
  
  server.register( crudRoutes, {
    basePath: '/api/matchHistory',
    entityName: 'matchHistory',
    controller: matchHistoryController,
  });

}

export default fp( matchHistoryRoutes );

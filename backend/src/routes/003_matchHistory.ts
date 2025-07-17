import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { matchHistoryRefSchemas } from '../modules/match/matchHistory.schema';
import { matchHistoryController } from '../modules/match/matchHistory.controller';

import { responseRefSchemas } from '../modules/response/response.schema';

const matchRoutes = async ( server: FastifyInstance ) => {
  
  server.register( crudRoutes, {
    basePath: '/api/match',
    entityName: 'match',
    controller: matchController,
  });

}

export default fp( matchRoutes );

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { matchRefSchemas } from '../modules/match/match.schema';
import { matchController } from '../modules/match/match.controller';

import { responseRefSchemas } from '../modules/response/response.schema';
import { contextFactory } from '../utils/contextFactory';

const matchRoutes = async ( server: FastifyInstance ) => {
  
  server.register( crudRoutes, {
    basePath: '/api/match',
    entityName: 'match',
    controller: matchController,
    contextFactory: contextFactory,
  });

}

export default fp( matchRoutes );

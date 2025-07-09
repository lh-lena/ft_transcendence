import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { createContext } from '../utils/contextFactory';
import crudRoutes from '../utils/crudRoutes';

import { userRefSchemas } from '../modules/user/user.schema';
import { userController } from '../modules/user/user.controller';

import { responseRefSchemas } from '../modules/response/response.schema';

const userRoutes = async ( server: FastifyInstance ) => {
  
  server.register( crudRoutes, {
    basePath: '/api/user',
    entityName: 'user',
    controller: userController,
    contextFactory: createContext( server.db, server.context ),
  });
  console.log( 'User routes registered' );
}

export default fp( userRoutes );

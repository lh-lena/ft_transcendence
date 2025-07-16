import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { matchRefSchemas } from '../modules/match/match.schema';
import { userRefSchemas } from '../modules/user/user.schema';

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
  
  server.patch( '/api/match/user/:id', {
    params: {
      id: { $ref: 'userId' },
      response: { 
        200: { $ref: 'matchResponse' },
        400: { $ref: 'BadRequest' },
      },
      summary: 'Set player to ready. Start game when every player is ready',
    },
    handler: async ( request, reply ) => {
      console.log( typeof request.params.id );
      const context = contextFactory( server.db, server.config );
      const ret = await matchController.updateUser( context, Number( request.params.id ) );

      return reply.code( 200 ).send( `user ${request.params.id} is ready` );
    }
  });

}

export default fp( matchRoutes );

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { gameRefSchemas } from '../modules/game/game.schema';
import { gameController } from '../modules/game/game.controller';

import { responseRefSchemas } from '../modules/response/response.schema';

const gameRoutes = async ( server: FastifyInstance ) => {
  
  server.register( crudRoutes, {
    basePath: '/api/game',
    entityName: 'game',
    controller: gameController,
    routes: [ 'getAll', 'getById', 'create' ],
  });

  server.post( '/api/game/join/:id', {
    schema: {
      params: { $ref: 'gameId' },
      body: { $ref: 'gameCreate' },
      response: {
        200: { $ref: 'gameResponse' },
        404: { $ref: 'NotFound' },
      },
      summary: 'Join a private game',
    },
    handler: async ( request, reply ) => {
      
      const ret = await gameController.join( request.params.id, request.body );

      return reply.code( 200 ).send( ret );
    }
  });

}

export default fp( gameRoutes );

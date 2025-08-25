import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';
import { gameController } from '../modules/game/game.controller';

import { gameType, gameJoinType } from '../schemas/game';

const gameRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<gameType, null, gameJoinType, null, string>(), {
    basePath: '/api/game',
    entityName: 'game',
    controller: gameController,
    routes: ['getById', 'create'],
  });
};

export default fp(gameRoutes);

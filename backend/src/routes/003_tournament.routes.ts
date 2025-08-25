import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { tournamentController } from '../modules/tournament/tournament.controller';
import type { tournamentType, tournamentCreateType } from '../schemas/tournament';

const tournamentRoutes = async (server: FastifyInstance) => {
  server.register(crudRoutes<tournamentType, null, tournamentCreateType, null, string>(), {
    basePath: '/api/tournament',
    entityName: 'tournament',
    controller: tournamentController,
    routes: ['getById', 'create'],
  });
};

export default fp(tournamentRoutes);

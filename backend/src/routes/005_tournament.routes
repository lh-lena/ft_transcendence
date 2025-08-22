import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import crudRoutes from '../utils/crudRoutes';

import { tournamentController } from '../modules/tournament/tournament.controller';
import type { tournamentType, tournamentCreateType, tournamentIdType } from '../schemas/tournament';

const tournamentRoutes = async (server: FastifyInstance) => {
  server.register(
    crudRoutes<tournamentType, null, tournamentCreateType, tournamentIdType, number>(),
    {
      basePath: '/api/tournament',
      entityName: 'tournament',
      controller: tournamentController,
      routes: ['getById', 'create', 'delete'],
    },
  );
};

export default fp(tournamentRoutes);

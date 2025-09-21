import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { AxiosRequestConfig } from 'axios';
import { apiClientBackend } from '../utils/apiClient';

import { tournamentCreateSchema, tournamentIdSchema } from '../schemas/tournament';
import type { TournamentCreateType, TournamentIdType, TournamentType } from '../schemas/tournament';

const backendTournamentRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/api/tournament/:tournamentId', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = tournamentIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ message: 'Invalid tournamentId' });
    }

    const tournamentId: TournamentIdType = parsedReq.data;

    const method = req.method.toLowerCase();
    const url = `/tournament/${tournamentId.tournamentId}`;

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: req.headers,
      params: tournamentId,
    };

    const tournament: TournamentType = await apiClientBackend(config);

    return reply.code(200).send(tournament);
  });

  fastify.post('/api/tournament', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = tournamentCreateSchema.safeParse(req.body);
    console.log('Parsed Request:', parsedReq);
    if (!parsedReq.success) {
      return reply.code(400).send({ message: 'Invalid tournament creation data' });
    }

    const newTournament: TournamentCreateType = parsedReq.data;

    if (newTournament.userId !== req.user.id) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const config: AxiosRequestConfig = {
      method: 'post',
      url: '/tournament',
      data: newTournament,
    };

    const createdTournament: TournamentType = await apiClientBackend(config);

    return reply.code(201).send({ createdTournament });
  });
};

export default fp(backendTournamentRoutes);

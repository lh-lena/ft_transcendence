import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { apiClientBackend } from '../utils/apiClient';

import { tournamentCreateSchema, tournamentIdSchema } from '../schemas/tournament';
import type { TournamentCreateType, TournamentIdType, TournamentType } from '../schemas/tournament';

const backendTournamentRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/tournament/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = tournamentIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid tournamentId' });
    }

    const tournamentId: TournamentIdType = parsedReq.data;

    const tournament: TournamentType = await apiClientBackend.get('/game', {
      params: tournamentId,
    });

    return reply.code(200).send(tournament);
  });

  fastify.post('/tournament', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = tournamentCreateSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid tournament creation data' });
    }

    const newTournament: TournamentCreateType = parsedReq.data;

    if (newTournament.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const createdTournament: TournamentType = await apiClientBackend.post('/tournament', {
      body: newTournament,
    });

    return reply.code(201).send({ createdTournament });
  });
};

export default fp(backendTournamentRoutes);

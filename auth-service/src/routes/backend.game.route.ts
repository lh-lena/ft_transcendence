import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { apiClientBackend } from '../utils/apiClient';

import {
  gameCreateSchema,
  gameJoinSchema,
  gameIdSchema,
  gameResponseSchema,
} from '../schemas/game';
import type {
  GameType,
  GameCreateType,
  GameJoinType,
  GameIdType,
  GameResponseType,
} from '../schemas/game';

const backendGameRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/game/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = gameIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid gameId' });
    }

    const gameId: GameIdType = parsedReq.data;

    const game: GameType = await apiClientBackend.get('/game', { params: gameId });

    const ret = gameResponseSchema.safeParse(game);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse game data' });
    }

    const gameRet: GameResponseType = ret.data;
    return reply.code(200).send(gameRet);
  });

  fastify.post('/game', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = gameCreateSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid game creation data' });
    }

    const newGame: GameCreateType = parsedReq.data;

    if (newGame.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const createdGame: GameType = await apiClientBackend.post('/game', { body: newGame });

    const ret = gameResponseSchema.safeParse(createdGame);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse game data' });
    }

    const gameRet = ret.data;

    return reply.code(201).send({ gameRet });
  });

  fastify.post('/game/join', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = gameJoinSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid Chat Message' });
    }

    const gameToJoin: GameJoinType = parsedReq.data;

    if (gameToJoin.userId !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const joinedGame: GameType = await apiClientBackend.post(`/chat`, { params: gameToJoin });

    const ret = gameResponseSchema.safeParse(joinedGame);

    if (!ret.success) {
      return reply.code(500).send({ error: 'Failed to parse chat data' });
    }

    const chatRet: GameResponseType = ret.data;
    return reply.code(201).send(chatRet);
  });
};

export default fp(backendGameRoutes);

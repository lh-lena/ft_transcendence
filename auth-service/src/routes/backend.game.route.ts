import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AxiosRequestConfig } from 'axios';
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

//TODO add delete game route

const backendGameRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/api/game/:gameId', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = gameIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ message: 'Invalid gameId' });
    }

    const gameId: GameIdType = parsedReq.data;

    const method = req.method.toLowerCase();
    const url = `/game/${gameId.gameId}`;

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: req.headers,
      params: gameId,
    };
    const game: GameType = await apiClientBackend(config);

    const ret = gameResponseSchema.safeParse(game);

    if (!ret.success) {
      return reply.code(500).send({ message: 'Failed to parse game data' });
    }

    const gameRet: GameResponseType = ret.data;
    return reply.code(200).send(gameRet);
  });

  fastify.post('/api/game', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = gameCreateSchema.safeParse(req.body);

    if (!parsedReq.success) {
      return reply.code(400).send({ message: 'Invalid game creation data' });
    }

    const newGame: GameCreateType = parsedReq.data;

    if (newGame.userId !== req.user.id) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const method = req.method.toLowerCase();
    const url = '/game';

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: req.headers,
      data: newGame,
    };
    const createdGame: GameType = await apiClientBackend(config);

    const ret = gameResponseSchema.safeParse(createdGame);

    if (!ret.success) {
      return reply.code(500).send({ message: 'Failed to parse game data' });
    }

    const gameRet = ret.data;

    return reply.code(201).send({ gameRet });
  });

  fastify.post('/api/game/join', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = gameJoinSchema.safeParse(req.body);
    console.log('Parsed Request:', parsedReq);
    if (!parsedReq.success) {
      return reply.code(400).send({ message: 'Invalid Game Parameters' });
    }

    const gameToJoin: GameJoinType = parsedReq.data;

    if (gameToJoin.userId !== req.user.id) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const config: AxiosRequestConfig = {
      method: 'post',
      url: '/game/join',
      data: gameToJoin,
    };
    const joinedGame: GameType = await apiClientBackend(config);

    const ret = gameResponseSchema.safeParse(joinedGame);
    console.log('Parsed Response:', ret);
    if (!ret.success) {
      return reply.code(500).send({ message: 'Failed to parse game data' });
    }

    const gameRet: GameResponseType = ret.data;
    return reply.code(201).send(gameRet);
  });
};

export default fp(backendGameRoutes);

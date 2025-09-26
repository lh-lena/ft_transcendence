import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ResponseSchema } from '../../schemas/response.schema.js';
import { GameStartRequestSchema, BackendStartGame } from '../../schemas/game.schema.js';
import { processErrorLog } from '../../utils/error.handler.js';
import type { GameStateService } from 'game/types/game.types.js';

export const setupGameRoutes = (app: FastifyInstance): void => {
  app.post('/game/start', {
    schema: {
      body: GameStartRequestSchema,
      response: {
        200: ResponseSchema,
        500: ResponseSchema,
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const requestBody = request.body as BackendStartGame;

        const gameSession = await app.gameService.handleStartGame(requestBody);
        if (!gameSession) {
          return reply.code(500).send({
            success: false,
            message: 'Internal server error while processing game start',
          });
        }
        return reply.code(200).send({ success: true });
      } catch (error: unknown) {
        processErrorLog(app, 'game-routes', 'Error processing game start request:', error);
        return reply.code(500).send({
          success: false,
          message: 'Internal server error while processing game start',
        });
      }
    },
  });
};

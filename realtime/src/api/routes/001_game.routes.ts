import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ResponseSchema } from '../../schemas/response.schema.js';
import { GameStartRequestSchema, BackendStartGame } from '../../schemas/game.schema.js';
import { processErrorLog } from '../../utils/error.handler.js';
import { GameService } from '../../game/types/game.types.js';
import { RespondService } from '../../websocket/types/ws.types.js';

export const setupGameRoutes = (app: FastifyInstance): void => {
  app.post('/game/start', {
    schema: {
      tags: ['Game'],
      description: 'Start a game based on the acquired game data',
      body: GameStartRequestSchema,
      response: {
        200: ResponseSchema,
        400: ResponseSchema,
        500: ResponseSchema,
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const requestBody = request.body as BackendStartGame;
        const gameService = app.gameService as GameService;

        const result = await gameService.initializeGameSession(requestBody);
        if (!result) {
          return reply.code(400).send({
            success: false,
            message: 'Failed to initialize game session',
          });
        }
        const respond = app.respond as RespondService;
        respond.gameReady(requestBody.gameId);
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

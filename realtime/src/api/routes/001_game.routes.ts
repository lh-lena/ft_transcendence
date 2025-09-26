import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ResponseSchema } from '../../schemas/response.schema.js';
import { GameStartRequestSchema, BackendStartGame } from '../../schemas/game.schema.js';
import { processErrorLog } from '../../utils/error.handler.js';

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

        const gameSession = await app.gameService.handleStartGame(requestBody);
        if (!gameSession) {
          return reply.code(400).send({
            success: false,
            message: 'Failed to start game',
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
// If you want to reuse schemas via $ref, first app.addSchema({ $id: 'GameStateSchema', ... }) and then reference with $ref: 'GameStateSchema#'.

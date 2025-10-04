import { FastifyInstance } from "fastify";
import { StartGame } from "../schemas/game.schema.js";
import { GameMode } from "../constants/game.constants.js";
import { GameResult, GameResultSchema } from "../schemas/game.schema.js";
import { z } from "zod";

export function fetchStartGame(app: FastifyInstance) {
  let i = 0;
  const MOCK_GAME_RESPONSES: { [key: string]: StartGame } = {
      'test-game-1': {
        gameId: 'test-game-1',
        mode: GameMode.PVP_REMOTE,
        players: [
          { userId: '0', userAlias: 'PlayerA', username: 'n/a', isAI: false },
          { userId: '1', userAlias: 'PlayerB', username: 'n/a', isAI: false }
        ]
      }
    }

    app.get<{ Params: { gameId: string }; }>(
      '/api/game/:gameId',
      async (request, reply) => {
        const { gameId } = request.params;

        // Handle specific mock data
        const mockData = MOCK_GAME_RESPONSES[gameId];
        app.log.debug(mockData, `[Mock Backend] Fetching game data for game ID: ${gameId}`);
        if (mockData) {
          app.log.debug(`[Mock Backend] Responding with mock data for game ID: ${gameId}`);
          return reply.send(mockData);
        } else if (gameId === 'invalid-schema') {
          // Simulate a response that doesn't match the schema
          app.log.debug(`[Mock Backend] Simulating invalid schema data for game ID: ${gameId}`);
          return reply.status(200).send({ gameId: 'invalid-schema', gameMode: 'INVALID', players: [{ id: 'wrong' }] });
        } else {
          // Default: Game not found
          app.log.debug(`[Mock Backend] Game ID ${gameId} not found in mock data. Sending 404.`);
          return reply.status(404).send({ message: `Game ${gameId} not found in mock backend.` });
        }
      }
  );

  app.get('/api/auth/me', async (request, reply) => {
    app.log.info(`[Mock Backend] GET /api/auth/me received`);
    const mockUser = {
      userId: i % 2 === 0 ? 1 : 0,
      userAlias: 'PlayerA',
      username: `mockUser${i}`
    };
    i++;
    app.log.debug(`[Mock Auth] Responding with mock user data for userId: ${mockUser.userId}`);
    return reply.status(200).send(mockUser);
  });

  app.post<{ Body: GameResult }>(
    '/api/games/result',
    async (request, reply) => {
      try {
        const gameResult = request.body;
        if (!gameResult || !gameResult.gameId) {
          return reply.status(400).send({
            success: false,
            error: 'Missing required field: gameId',
            message: 'gameId is required'
          });
        }
    
    app.log.info({
      gameId: gameResult.gameId,
      winnerId: gameResult.winnerId,
    }, `[Mock Backend] Received game result for game ${gameResult.gameId}`);
    return reply.status(200).send({
      success: true,
      message: `Game result for ${gameResult.gameId} saved successfully`,
      gameId: gameResult.gameId,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    app.log.error(error, `[Mock Backend] Error processing game result:`);
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process game result'
    });
  }
  });
}
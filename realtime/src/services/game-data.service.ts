import { FastifyInstance } from 'fastify';
import { StartGame, GameResult, StartGameSchema } from '../schemas/game.schema.js';
import { GameError } from '../utils/game.error.js';

export default function createGameDataService(app: FastifyInstance) {
  const BACKEND_URL = app.config.websocket.backendUrl;
  if (!BACKEND_URL) {
    throw new Error('Backend URL is not configured');
  }

  async function fetchGameData(gameId: string): Promise<StartGame> {
    app.log.debug(`[game-data] Fetching game data from backend. Game ID: ${gameId}`);
    try {
      const response = await fetch(`${BACKEND_URL}/api/game/${gameId}`);

      if (!response.ok) {
        const errorDetails = await response.text();
        app.log.error(`Failed to fetch game data for ${gameId}. Status: ${response.status} - ${response.statusText}. Details: ${errorDetails}`);
        throw new GameError(`failed to fetch game data for ${gameId}`);
      }

      const rawGameData : unknown = await response.json();
      const ValidationResult = StartGameSchema.safeParse(rawGameData);
      if (ValidationResult.success) {
        const gameData = ValidationResult.data;
        app.log.debug({
          gameId,
          mode: gameData.gameMode,
          AIDifficulty: gameData?.aiDifficulty,
          playersCount: gameData.players?.length || 0
        },`[game-data] Successfully fetched game data`);

        return gameData;
      } else {
        app.log.error(`[game-data] Invalid game data received for game ${gameId}. Validation errors: ${JSON.stringify(ValidationResult.error.issues)}`);
        throw new GameError(`invalid game data received for game ${gameId}. try to create a new game`);
      }
    } catch (error) {
      throw error;
    }
  }

  async function sendGameResult(result: GameResult): Promise<boolean> {
    app.log.debug({ gameId: result.gameId }, `[game-data] Sending game result to backend`);
    try {
      const response = await fetch(`${BACKEND_URL}/api/games/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        app.log.error(`Failed to send results of the game ${result.gameId}. Status: ${response.status} - ${response.statusText}`);
        throw new GameError(`failed to send game result for ${result.gameId}`);
      }

      app.log.debug({ gameId: result.gameId }, `[game-data] Game result sent successfully`);
      return true;
    } catch (error) {
      app.log.error(`Failed to send results of the game ${result.gameId}. ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  return {
    fetchGameData,
    sendGameResult
  };
}
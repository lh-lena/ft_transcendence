import { FastifyInstance } from 'fastify';
import { ErrorCode, ServiceError } from '../types/error.types.js';
import { Result, ok, err } from 'neverthrow';
import { StartGame, GameResult, StartGameSchema } from '../schemas/game.schema.js';

export default function createGameDataService(app: FastifyInstance) {
  const BACKEND_URL = app.config.websocket.backendUrl;

  async function fetchGameData(gameId: string): Promise<Result<StartGame, ServiceError>> {
    app.log.debug(`Fetching game data from backend. Game ID: ${gameId}`);
    try {
      const response = await fetch(`${BACKEND_URL}/api/game/:${gameId}`);

      if (!response.ok) {
        const errorDetails = await response.text();
        return err({
          code: ErrorCode.FETCH_FAILED,
          message: `Failed to fetch game data for ${gameId}: HTTP ${response.status} - ${response.statusText}`,
          details: { gameId, status: response.status, responseBody: errorDetails }
        });
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
        },`Successfully fetched game data`);
        
        return ok(gameData);
      } else {
        return err({
          code: ErrorCode.INVALID_GAME_DATA,
          message: `Invalid game data received for game ${gameId}`,
          details: {
            gameId,
            errors: ValidationResult.error.errors.map(err => err.message)
          }
        });
      }
    } catch (error) {
      return err({
        code: ErrorCode.FETCH_FAILED,
        message: `Network error while fetching game data`,
        details: { gameId, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  async function sendGameResult(result: GameResult): Promise<Result<void, ServiceError>> {
    app.log.debug({ gameId: result.gameId }, `Sending game result to backend`);
    try {
      const response = await fetch(`${BACKEND_URL}/api/games/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        app.log.error(`Failed to send results of the game ${result.gameId}. Status: ${response.status} - ${response.statusText}`);
        return err({
          code: ErrorCode.SEND_RESULT_FAILED,
          message: `Failed to send game result: HTTP ${response.status}`,
          details: { gameId: result.gameId, status: response.status }
        });
      }

      app.log.debug({ gameId: result.gameId }, `Game result sent successfully`);
      return ok(undefined);
    } catch (error) {
      app.log.error(`Failed to send results of the game ${result.gameId}. ${error instanceof Error ? error.message : 'Unknown error'}`);
      return err({
        code: ErrorCode.FETCH_FAILED,
        message: 'Network error while sending game result',
        details: { gameId: result.gameId, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  return {
    fetchGameData,
    sendGameResult
  };
}
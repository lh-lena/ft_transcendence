import type { FastifyInstance } from 'fastify';
import type { StartGame, GameResult, GameIdType } from '../../schemas/game.schema.js';
import { StartGameSchema } from '../../schemas/game.schema.js';
import { GameError } from '../../utils/game.error.js';
import { processErrorLog } from '../../utils/error.handler.js';
import type { GameDataService } from '../types/game.js';
import type { EnvironmentConfig } from '../../config/config.js';

export default function createGameDataService(app: FastifyInstance): GameDataService {
  const { log } = app;
  const config = app.config as EnvironmentConfig;
  const BACKEND_URL = config.websocket.backendUrl;
  if (BACKEND_URL === undefined || BACKEND_URL === '') {
    throw new Error('Backend URL is not configured');
  }

  async function fetchGameData(gameId: GameIdType): Promise<StartGame> {
    log.debug(`[game-data] Fetching game data from backend. Game ID: ${gameId}`);
    const response = await fetch(`${BACKEND_URL}/api/game/${gameId}`);

    if (response.status !== 200) {
      const errorDetails = await response.text();
      throw new GameError(
        `failed to fetch game data for ${gameId}. Status: ${response.status} - ${response.statusText}. Details: ${errorDetails}`,
      );
    }

    const rawGameData: unknown = await response.json();
    const ValidationResult = StartGameSchema.safeParse(rawGameData);
    if (ValidationResult.success) {
      const gameData = ValidationResult.data;
      log.debug(
        {
          gameId,
          mode: gameData.gameMode,
          AIDifficulty: gameData?.aiDifficulty,
          playersCount: gameData.players?.length || 0,
        },
        `[game-data] Successfully fetched game data`,
      );

      return gameData;
    } else {
      throw new GameError(
        `invalid game data received for game ${gameId}. Validation errors: ${JSON.stringify(ValidationResult.error.issues)}. try to create a new game`,
      );
    }
  }

  async function sendGameResult(result: GameResult): Promise<boolean> {
    log.debug({ gameId: result.gameId }, `[game-data] Sending game result to backend`);
    try {
      const response = await fetch(`${BACKEND_URL}/api/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      if (response.status !== 201) {
        throw new GameError(
          `failed to send game result for ${result.gameId}. Status: ${response.status} - ${response.statusText}`,
        );
      }

      log.debug({ gameId: result.gameId }, `[game-data] Game result sent successfully`);
      return true;
    } catch (error: unknown) {
      processErrorLog(app, 'game-data', `Failed to send game result. ID ${result.gameId}`, error);
      return false;
    }
  }

  return {
    fetchGameData,
    sendGameResult,
  };
}

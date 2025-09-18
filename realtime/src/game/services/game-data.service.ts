import type { FastifyInstance } from 'fastify';
import type { BackendStartGame, GameResult, GameIdType } from '../../schemas/game.schema.js';
import { BackendStartGameSchema } from '../../schemas/game.schema.js';
import { GameError } from '../../utils/game.error.js';
import { processErrorLog } from '../../utils/error.handler.js';
import type { GameDataService } from '../types/game.types.js';
import type { EnvironmentConfig } from '../../config/config.js';

export default function createGameDataService(app: FastifyInstance): GameDataService {
  const config = app.config as EnvironmentConfig;
  const BACKEND_URL = config.websocket.backendUrl;
  if (BACKEND_URL === undefined || BACKEND_URL === '') {
    throw new Error('Backend URL is not configured');
  }

  async function fetchGameData(gameId: GameIdType): Promise<BackendStartGame> {
    const response = await fetch(`${BACKEND_URL}/api/game/${gameId}`);

    if (response.status !== 200) {
      const errorDetails = await response.text();
      throw new GameError('error starting the game. try later', errorDetails);
    }

    const rawGameData: unknown = await response.json();
    const ValidationResult = BackendStartGameSchema.safeParse(rawGameData);
    if (ValidationResult.success) {
      const gameData = ValidationResult.data;
      return gameData;
    } else {
      throw new GameError(
        'invalid game data received. try to create a new game',
        ValidationResult.error.message,
      );
    }
  }

  async function sendGameResult(result: GameResult): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      if (response.status !== 201) {
        const errorDetails = await response.text();
        throw new GameError(`failed to send game result for ${result.gameId}`, errorDetails);
      }
      return true;
    } catch (error: unknown) {
      processErrorLog(app, 'game-data', `Failed to send game result. ID ${result.gameId}`, error);
      return false;
    }
  }

  async function deleteAIGame(gameId: GameIdType): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/game/${gameId}`, {
        method: 'DELETE',
      });
      if (response.status !== 200) {
        const errorDetails = await response.text();
        throw new GameError(`failed to delete AI game. ID ${gameId}`, errorDetails);
      }
      return true;
    }
    catch (error: unknown) {
      processErrorLog(app, 'game-data', `Failed to delete AI game. ID ${gameId}`, error);
      return false;
    }
  }

  return {
    fetchGameData,
    sendGameResult,
    deleteAIGame,
  };
}

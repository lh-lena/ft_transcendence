import { FastifyInstance } from 'fastify';
import { StartGame, GameResult, AIDifficulty } from '../types/pong.types.js';

export default function createGameDataService(app: FastifyInstance) {

  async function fetchGameData(gameId: string): Promise<StartGame> {
    app.log.debug(`Fetching game data from backend. Game ID: ${gameId}`);

    const BACKEND_URL = app.config.websocket.backendUrl;
    const response = await fetch(`${BACKEND_URL}/api/game/:${gameId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch game data: HTTP ${response.status} - ${response.statusText}`);
    }

    const gameData = await response.json();

    if (!gameData.gameId || gameData.gameId !== gameId) {
      throw new Error(`Invalid game data received for game ${gameId}`);
    }

    app.log.debug({ 
      gameId,
      mode: gameData.gameMode,
      AIDifficulty: gameData?.aiDifficulty,
      playersCount: gameData.players?.length || 0
    },`Successfully fetched game data`);

    return gameData;
  }

  async function sendGameResult(result: GameResult): Promise<void> {
    app.log.debug({ gameId: result.gameId }, `Sending game result to backend`);

    const BACKEND_URL = app.config.websocket.backendUrl;

    try {
      const response = await fetch(`${BACKEND_URL}/api/games/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      app.log.debug({ gameId: result.gameId }, `Game result sent successfully`);
    } catch (error) {
      app.log.error(`Failed to send game result`, error instanceof Error ? error.message : 'Unknown error', {
        gameId: result.gameId
      });
      throw error;
    }
  }

  return {
    fetchGameData,
    sendGameResult
  };
}
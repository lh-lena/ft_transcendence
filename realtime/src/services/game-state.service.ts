import { FastifyInstance } from 'fastify';
import { GameInstance, GameSessionStatus, GameResult, GameState } from '../types/pong.types.js';
import { PausedGameState } from '../types/network.types.js';

export default function createGameStateService(app: FastifyInstance) {
  const pausedGames: Map<string, PausedGameState> = new Map();

  async function startGame(gameId: string): Promise<void> {
    app.log.info(`[game-service] Starting the game ${gameId}`);
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.error(`[game-service] Failed to initialize game ${gameId}`);
      return;
    }

    if (game.status === GameSessionStatus.ACTIVE) {
      app.log.debug(`[game-service] Game ${gameId} is already active`);
      return;
    }

    const { gameState } = game;
    const now = Date.now();

    app.gameSessionService.updateGameSession(gameId, {
      lastUpdate: now,
      startedAt: now.toString(),
      status: GameSessionStatus.ACTIVE
    });

    gameState.status = GameSessionStatus.ACTIVE;

    startGameLoop(game);

    broadcastsGameUpdate(gameId, gameState);
    
    app.log.debug(`[game-service] Game started ${gameId} for ${game.players.map(p => p.userAlias).join(' vs ')} in mode ${game.gameMode}`);
  }

  function pauseGame(gameId: string, reason: string): void {
    app.log.info(`[game-service] Pausing game ${gameId} - Reason: ${reason}`);
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.warn(`[game-service] Cannot pause - game ${gameId} not found`);
      return;
    }

    if (game.status !== GameSessionStatus.ACTIVE) {
      app.log.debug(`[game-service] Game ${gameId} is not active. Game status: ${game.status}`);
      return;
    }

    stopGameLoop(game);

    app.gameSessionService.updateGameSession(gameId, {
      status: GameSessionStatus.PAUSED
    });

    storePausedGameInfo(gameId, game, reason);

    app.wsService.broadcastToGame(gameId, {
      event: 'game_pause',
      payload: { gameId, reason }
    });
    app.log.info(`[game-service] Game paused ${gameId} - Reason: ${reason}`);
  }

  function resumeGame(gameId: string): void {
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    const pausedState = pausedGames.get(gameId);
    
    if (!game) {
      app.log.error(`[game-service] Cannot resume - game ${gameId} not found`);
      return;
    }

    if (game.status !== GameSessionStatus.PAUSED || !pausedState) {
      app.log.warn(`[game-service] Cannot resume - game ${gameId} not paused. Status: ${game.status}`);
      return;
    }

    app.gameSessionService.updateGameSession(gameId, {
      status: GameSessionStatus.ACTIVE
    });
    removePausedGameInfo(gameId);
    const {gameState } = game;

    startGameLoop(game);

    broadcastsGameUpdate(gameId, gameState);

    app.log.debug(`[game-service] Game resumed ${gameId}`);
  }

  async function endGame(gameId: string, status: GameSessionStatus.CANCELLED | GameSessionStatus.FINISHED, reason: string) : Promise<void> {
    app.log.debug(`[game-service] Ending game ${gameId}. Reason: ${reason}`);

    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.warn(`[game-service] Cannot end - game ${gameId} not found`);
      return;
    }

    stopGameLoop(game);

    app.gameSessionService.updateGameSession(gameId, {
      finishedAt: Date.now().toString(),
      status: status
    });

    game.gameState.status = status;

    const result = createGameResult(game, status);

    game.players.forEach(player => {
      if (player.userId !== -1) {
        app.gameService.removeGameForPlayer(player.userId);
      }
    });

    await app.gameDataService.sendGameResult(result);

    app.wsService.broadcastToGame(gameId, {
      event: 'game_ended',
      payload: result
    });
    cleanup(gameId);
    app.log.debug(`[game-service] Game ended ${gameId}`);
  }

  function startGameLoop(game: GameInstance) : void {
    app.log.debug(`[game-state] Starting the game loop. Game ID ${game.gameId}`);
  }

  function stopGameLoop(game: GameInstance): void {
    if (game.gameLoopInterval) {
      clearInterval(game.gameLoopInterval);
      game.gameLoopInterval = undefined;
    }
  }

  function createGameResult(game: GameInstance, status: GameSessionStatus.CANCELLED | GameSessionStatus.FINISHED): GameResult {
    const isPlayer1Winner = game.gameState.paddle1.score > game.gameState.paddle2.score;
    const result: GameResult = {
      gameId: game.gameId,
      scorePlayer1: game.gameState.paddle1.score,
      scorePlayer2: game.gameState.paddle2.score,
      player1Username: game.players[0]?.userAlias || 'Player 1',
      player2Username: game.players[1]?.userAlias || 'Player 2',
      winnerId: isPlayer1Winner ? game.players[0]?.userId : game.players[1]?.userId,
      loserId: isPlayer1Winner ? game.players[1]?.userId : game.players[0]?.userId,
      status,
      startedAt: game.startedAt!,
      finishedAt: game.finishedAt!
    };
    return result;
  }

  function storePausedGameInfo(gameId: string, game: GameInstance, reason: string): void {
    const pausedInfo: PausedGameState = {
      gameId,
      reason,
      pausedAt: Date.now(),
      players: game.players
    };
    pausedGames.set(gameId, pausedInfo);
  }

  function removePausedGameInfo(gameId: string): void {
    pausedGames.delete(gameId);
  }

  function broadcastsGameUpdate(gameId: string, gameState: GameState) {
    app.wsService.broadcastToGame(gameId, {
      event: 'game_update',
      payload: gameState
    });
  }

  function cleanup(gameId: string) : void {
    app.log.info(`[game-service] Scheduling cleanup for game ${gameId} in ${app.config.websocket.connectionTimeout}ms`);

    setTimeout(() => {
      app.log.info(`[game-service] Cleaning up game ${gameId}`);
      app.gameSessionService.removeGameSession(gameId);
      pausedGames.delete(gameId);
      app.log.debug(`[game-service] Game ${gameId} removed from sessions`);
    }, app.config.websocket.connectionTimeout);
  }

  return {
    startGame,
    pauseGame,
    resumeGame,
    endGame,
  }
}

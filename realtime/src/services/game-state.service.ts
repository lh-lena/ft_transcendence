import { FastifyInstance } from 'fastify';
import { GameInstance, GameSessionStatus, GameResult, GameState, PONG_CONFIG, GameMode, User } from '../types/pong.types.js';
import { PausedGameState } from '../types/network.types.js';
import { updateGame, checkWinCondition } from './pong-engine.service.js';
import { measureMemory } from 'vm';

export default function createGameStateService(app: FastifyInstance) {
  const pausedGames: Map<string, PausedGameState> = new Map();
  const pauseTimeouts = new Map<string, NodeJS.Timeout>();

  async function startGame(gameId: string): Promise<void> {
    app.log.info(`[game-service] Starting the game ${gameId}`);
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.error(`[game-state] Failed to initialize game ${gameId}`);
      return;
    }

    if (game.status === GameSessionStatus.ACTIVE) {
      app.log.debug(`[game-state] Game ${gameId} is already active`);
      return;
    }

    const { gameState } = game;
    const now = Date.now();

    gameState.status = GameSessionStatus.ACTIVE;
    gameState.countdown = PONG_CONFIG.COUNTDOWN;

    app.gameSessionService.updateGameSession(gameId, {
      lastUpdate: now,
      startedAt: now.toString(),
      status: GameSessionStatus.ACTIVE,
      lastCountdownTime: Date.now()
    });

    broadcastGameUpdate(game.players, gameState);

    await startCountdownSequence(game);

    startGameLoop(game);

    app.log.debug(`[game-state] Game started ${gameId} for ${game.players.map(p => p.userAlias).join(' vs ')} in mode ${game.gameMode}`);
  }

  function pauseGame(pausedByPlayerId: number, gameId: string, reason: string): void {
    app.log.info(`[game-service] Pausing game ${gameId} - Reason: ${reason}`);
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.warn(`[game-state] Cannot pause - game ${gameId} not found`);
      return;
    }

    if (game.status !== GameSessionStatus.ACTIVE) {
      app.log.debug(`[game-state] Game ${gameId} is not active. Game status: ${game.status}`);
      return;
    }

    if (!app.gameStateService.isExpectedPlayer(game.players, pausedByPlayerId)) {
      app.log.debug(`[game-state] Player ${pausedByPlayerId} is not a participant in game ${gameId}. Cannot pause.`);
      return;
    }

    stopGameLoop(game); // should i stop the game loop?

    app.log.info(`[game-state] Game paused ${gameId} - Reason: ${reason}`);

    app.gameSessionService.updateGameSession(gameId, {
      status: GameSessionStatus.PAUSED
    });
    game.gameState.status = GameSessionStatus.PAUSED;

    storePausedGameInfo(gameId, game, reason, pausedByPlayerId);

    app.wsService.broadcastToGame(gameId, {
      event: 'game_pause',
      payload: { gameId, reason, pauseTimeout: app.config.websocket.pauseTimeout }
    });

    app.wsService.broadcastToGame(gameId, {
      event: 'norification',
      payload: { gameId, message: `Game paused for ${app.config.websocket.pauseTimeout}` }
    });

    const pauseTimeout = setTimeout(() => {
      app.log.info(`[game-state] Auto-resuming game ${gameId} after pause timeout`);
      resumeGame(pausedByPlayerId, gameId); // for now same player will resume, but it's automatic
      pauseTimeouts.delete(gameId);
    }, app.config.websocket.pauseTimeout);
  
    // Store timeout reference
    pauseTimeouts.set(gameId, pauseTimeout);
  }

  async function resumeGame(resumeByPlayerId: number, gameId: string): Promise<void> {
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    const pausedState = pausedGames.get(gameId);
    
    if (!game) {
      app.log.error(`[game-state] Cannot resume - game ${gameId} not found`);
      return;
    }

    if (game.status !== GameSessionStatus.PAUSED || !pausedState) {
      app.log.warn(`[game-state] Cannot resume - game ${gameId} not paused. Status: ${game.status}`);
      return;
    }

    if (!app.gameStateService.isExpectedPlayer(game.players, resumeByPlayerId)) {
      app.log.warn(`[game-state] Player ${resumeByPlayerId} is not a participant in game ${gameId}. Cannot resume`);
      return;
    }

    if (pausedState.pausedByPlayerId !== resumeByPlayerId) {
      app.log.warn(`[game-state] Player ${resumeByPlayerId} cannot resume game ${gameId} - paused by ${pausedState.pausedByPlayerId}`);
      return;
    }

    removePausedGameInfo(gameId);
    const {gameState } = game;
    gameState.status = GameSessionStatus.ACTIVE;
    gameState.countdown = PONG_CONFIG.COUNTDOWN;

    app.gameSessionService.updateGameSession(gameId, {
      status: GameSessionStatus.ACTIVE,
      lastCountdownTime: Date.now()
    });

    app.wsService.broadcastToGame(gameId, {
      event: 'notification',
      payload: {
        type: 'info',
        gameId,
        message: `Game resumed by ${game.players.find(p => p.userId === resumeByPlayerId)?.userAlias || 'Unknown Player'}`,
        resumedAt: Date.now()
      }
    });

    startGameLoop(game);

    await startCountdownSequence(game);

    broadcastGameUpdate(game.players, gameState);

    app.log.debug(`[game-state] Game resumed ${gameId}`);
  }

  async function endGame(
    gameId: string,
    status: GameSessionStatus.CANCELLED | GameSessionStatus.FINISHED | GameSessionStatus.CANCELLED_SERVER_ERROR,
    reason: string) : Promise<void> {
    app.log.debug(`[game-state] Ending game ${gameId}. Reason: ${reason}`);

    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.warn(`[game-state] Cannot end - game ${gameId} not found`);
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

    // will be implemented
    // await app.gameDataService.sendGameResult(result);

    app.wsService.broadcastToGame(gameId, {
      event: 'game_ended',
      payload: result
    });
    cleanup(gameId);
    app.log.debug(`[game-state] Game ended ${gameId}`);
  }

  function startGameLoop(game: GameInstance) : void {
    app.log.debug(`[game-state] Starting the game loop. Game ID ${game.gameId}`);
    if (game.gameLoopInterval) {
      app.log.warn(`[game-state] Game loop already running for game ${game.gameId}`);
      return;
    }

    const targetFrameTime = 1000 / PONG_CONFIG.FPS;
    let accumulator = 0;
    game.lastUpdate = Date.now();
    game.frameCount = 0;

    game.gameLoopInterval = setInterval(() => {
      try { // rm
        if (game.status !== GameSessionStatus.ACTIVE) {
          app.log.warn(`[game-state] Game loop stopped for game ${game.gameId} - status: ${game.status}`);
          stopGameLoop(game);
          return;
        }

        const currentTime = Date.now();
        const deltaTime = currentTime - game.lastUpdate;
        game.lastUpdate = currentTime;
        if (deltaTime < 0 || deltaTime > 100) {
          app.log.warn(`[game-state-service] Invalid deltaTime detected for game ${game.gameId}: ${deltaTime}ms`);
          return;
        }
        accumulator += deltaTime;

        while (accumulator >= targetFrameTime) {
          
          // Update AI if present
          // const aiPlayer = game.players.find(p => p.isAI);
          // if (aiPlayer) {
          //   const aiAction = aiService.calculateMove(game.id, game.state);
          //   gameEngine.processInput(game, aiPlayer, aiAction);
          // }
          
          // Update game state
          if (game.gameState.countdown <= 0) {
            updateGame(game.gameState, targetFrameTime / 1000);
          }

          // Check win condition
          if (checkWinCondition(game.gameState)) {
            endGame(game.gameId, GameSessionStatus.FINISHED, 'Game completed');
            return;
          }

          game.frameCount!++;
          accumulator -= targetFrameTime;
        }

        if (game.frameCount! % 3 === 0) {
          broadcastGameUpdate(game.players, game.gameState, game.frameCount);
        }
        game.lastUpdate = currentTime;
      } catch (error) {
      app.log.error(`[game-state-service] Error in game loop for ${game.gameId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      endGame(game.gameId, GameSessionStatus.CANCELLED, 'Game loop error');
      }
    }, targetFrameTime);
  }

  async function startCountdownSequence(game: GameInstance): Promise<void> {
    const gameId = game.gameId;

    // Countdown sequence: 3, 2, 1, GO!
    const countdownMessages = [
      { count: 3, message: "Get Ready!\n3" },
      { count: 2, message: "2" },
      { count: 1, message: "1" },
      { count: 0, message: "GO!" }
    ];

    for (const { count, message } of countdownMessages) {
      if (game.status !== GameSessionStatus.ACTIVE) {
        app.log.debug(`[game-state-service] Countdown cancelled for game ${gameId} - game no longer active`);
        throw new Error(`Countdown cancelled for game ${gameId} - game no longer active`);
      }
      game.gameState.countdown = count;

      app.wsService.broadcastToGame(gameId, {
        event: 'countdown_update',
        payload: {
          gameId,
          countdown: count,
          message
        }
      });

      app.log.debug(`[game-state-service] Countdown for game ${gameId}: ${message}`);

      if (count >= 0) {
        await new Promise(resolve => setTimeout(resolve, 1300));
      }
    }
    
    setTimeout(() => {
      app.wsService.broadcastToGame(gameId, {
        event: 'notification',
        payload: {
          gameId,
          message: "Game started! Use arrow keys...",
          timestamp: Date.now()
        }});
    }, 500);
  }

  function stopGameLoop(game: GameInstance): void {
    if (game.gameLoopInterval) {
      clearInterval(game.gameLoopInterval);
      game.gameLoopInterval = undefined;
    }
  }

  function createGameResult(
    game: GameInstance,
    status: GameSessionStatus.CANCELLED | GameSessionStatus.FINISHED | GameSessionStatus.CANCELLED_SERVER_ERROR
  ): GameResult {
    const isPlayer1Winner = game.gameState.paddleA.score > game.gameState.paddleB.score;
    const isPlayer2Winner = game.gameState.paddleB.score > game.gameState.paddleA.score;
    
    let winnerId: number | null = null;
    let loserId: number | null = null;

    if (isPlayer1Winner) {
      winnerId = game.players[0]?.userId || null;
      loserId = game.players[1]?.userId || null;
    } else if (isPlayer2Winner) {
      winnerId = game.players[1]?.userId || null;
      loserId = game.players[0]?.userId || null;
    }

    if (status === GameSessionStatus.CANCELLED_SERVER_ERROR) {
      winnerId = null;
      loserId = null;
    }

    const result: GameResult = {
      gameId: game.gameId,
      scorePlayer1: game.gameState.paddleA.score,
      scorePlayer2: game.gameState.paddleB.score,
      player1Username: game.players[0]?.userAlias || 'Player 1',
      player2Username: game.players[1]?.userAlias || 'Player 2',
      winnerId,
      loserId,
      status,
      mode: game.gameMode,
      startedAt: game.startedAt!,
      finishedAt: game.finishedAt!
    };
    return result;
  }

  function storePausedGameInfo(gameId: string, game: GameInstance, reason: string, pausedByPlayerId: number): void {
    const pausedInfo: PausedGameState = {
      gameId,
      reason,
      pausedByPlayerId,
      pausedAt: Date.now(),
      players: game.players
    };
    pausedGames.set(gameId, pausedInfo);
  }

  function removePausedGameInfo(gameId: string): void {
    pausedGames.delete(gameId);

    const existingTimeout = pauseTimeouts.get(gameId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      pauseTimeouts.delete(gameId);
    }
  }

  function broadcastGameUpdate(players: User[], gameState: GameState, sequence: number = 0): void {
    app.wsService.sendToConnection(players[0].userId, {
      event: 'game_update',
      payload: {
        ...gameState,
        activePaddle: 'paddleA',
        sequence,
      }
    });
    if (players[1] && players[1].userId !== -1) {
      app.wsService.sendToConnection(players[1].userId, {
        event: 'game_update',
        payload: {
          ...gameState,
          activePaddle: 'paddleB',
          sequence,
        }
      });
    }
  }

  function cleanup(gameId: string) : void {
    app.log.info(`[game-service] Scheduling cleanup for game ${gameId} in ${app.config.websocket.connectionTimeout}ms`);
    const pauseTimeout = pauseTimeouts.get(gameId);
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      pauseTimeouts.delete(gameId);
    }
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

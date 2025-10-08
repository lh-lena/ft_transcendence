import fp from 'fastify-plugin';
import type { FastifyPluginCallback, FastifyInstance } from 'fastify';
import createGameService from '../game/services/game.service.js';
import createGameSessionService from '../game/services/game-session.service.js';
import createGameDataService from '../game/services/game-data.service.js';
import createGameStateService from '../game/services/game-state.service.js';
import createGameLoopService from '../game/services/game-loop.service.js';
import type { User } from '../schemas/user.schema.js';
import type { ClientEventPayload, GameSession } from '../schemas/index.js';
import { processErrorLog } from '../utils/error.handler.js';
import { GameSessionStatus, GAME_EVENTS } from '../constants/game.constants.js';

const plugin: FastifyPluginCallback = (app: FastifyInstance): void => {
  const gameSessionService = createGameSessionService(app);
  const gameDataService = createGameDataService(app);
  app.decorate('gameSessionService', gameSessionService);
  app.decorate('gameDataService', gameDataService);

  const gameLoopService = createGameLoopService(app);
  app.decorate('gameLoopService', gameLoopService);

  const gameStateService = createGameStateService(app);
  app.decorate('gameStateService', gameStateService);

  const gameService = createGameService(app);
  app.decorate('gameService', gameService);

  app.eventBus.on(
    GAME_EVENTS.START,
    ({ user, payload }: { user: User; payload: ClientEventPayload<GAME_EVENTS.START> }) => {
      gameService.handleStartGame(user, payload.gameId).catch((err: unknown) => {
        processErrorLog(
          app,
          'game-plugin',
          `Failed to handle game start from user ${user.userId}: `,
          err,
        );
      });
    },
  );

  app.eventBus.on(
    GAME_EVENTS.UPDATE,
    ({ user, payload }: { user: User; payload: ClientEventPayload<GAME_EVENTS.UPDATE> }) => {
      gameService.handlePlayerInput(user, payload);
    },
  );

  app.eventBus.on(
    GAME_EVENTS.LEAVE,
    ({ user, payload }: { user: User; payload: ClientEventPayload<GAME_EVENTS.LEAVE> }) => {
      gameService.handleGameLeave(user, payload.gameId).catch((err: unknown) => {
        processErrorLog(
          app,
          'game-plugin',
          `Failed to handle game leave for user ${user.userId}: `,
          err,
        );
      });
    },
  );

  app.eventBus.on(
    GAME_EVENTS.PAUSE,
    ({ user, payload }: { user: User; payload: ClientEventPayload<GAME_EVENTS.PAUSE> }) => {
      gameService.handleGamePause(user, payload.gameId);
    },
  );

  app.eventBus.on(
    GAME_EVENTS.RESUME,
    ({ user, payload }: { user: User; payload: ClientEventPayload<GAME_EVENTS.RESUME> }) => {
      gameService.handleGameResume(user, payload.gameId);
    },
  );

  app.eventBus.on(
    GAME_EVENTS.WIN_CONDITION_MET,
    ({ game, gameId }: { game: GameSession; gameId: string }) => {
      gameStateService.endGame(game, GameSessionStatus.FINISHED).catch((error: unknown) => {
        processErrorLog(
          app,
          'game-plugin',
          `Error ending game ${gameId} due to win condition:`,
          error,
        );
      });
    },
  );

  app.eventBus.on(
    GAME_EVENTS.SERVER_ERROR,
    ({ game, gameId }: { game: GameSession; gameId: string }) => {
      gameStateService
        .endGame(game, GameSessionStatus.CANCELLED_SERVER_ERROR)
        .catch((error: unknown) => {
          processErrorLog(
            app,
            'game-plugin',
            `Error ending game ${gameId} due to server error:`,
            error,
          );
        });
    },
  );
};

export const gamePlugin = fp(plugin, {
  name: 'game-plugin',
  dependencies: [
    'websocket-plugin',
    'event-bus-plugin',
    'auth-plugin',
    'config-plugin',
    'ai-plugin',
  ],
});

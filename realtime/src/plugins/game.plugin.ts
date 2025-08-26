import fp from 'fastify-plugin';
import type { FastifyPluginCallback, FastifyInstance } from 'fastify';
import createGameService from '../game/services/game.service.js';
import createGameSessionService from '../game/services/game-session.service.js';
import createGameDataService from '../game/services/game-data.service.js';
import createGameStateService from '../game/services/game-state.service.js';
import type { User } from '../schemas/user.schema.js';
import type { ClientEventPayload } from '../schemas/ws.schema.js';
import { processErrorLog } from '../utils/error.handler.js';

const plugin: FastifyPluginCallback = (app: FastifyInstance): void => {
  const gameSessionService = createGameSessionService(app);
  const gameDataService = createGameDataService(app);
  app.decorate('gameSessionService', gameSessionService);
  app.decorate('gameDataService', gameDataService);

  const gameStateService = createGameStateService(app);
  app.decorate('gameStateService', gameStateService);

  const gameService = createGameService(app);
  app.decorate('gameService', gameService);

  app.eventBus.on(
    'game_start',
    ({ user, payload }: { user: User; payload: ClientEventPayload<'game_start'> }) => {
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
    'game_update',
    ({ user, payload }: { user: User; payload: ClientEventPayload<'game_update'> }) => {
      gameService.handlePlayerInput(user, payload);
    },
  );

  app.eventBus.on(
    'game_leave',
    ({ user, payload }: { user: User; payload: ClientEventPayload<'game_leave'> }) => {
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
    'game_pause',
    ({ user, payload }: { user: User; payload: ClientEventPayload<'game_pause'> }) => {
      gameService.handleGamePause(user, payload.gameId);
    },
  );

  app.eventBus.on(
    'game_resume',
    ({ user, payload }: { user: User; payload: ClientEventPayload<'game_resume'> }) => {
      gameService.handleGameResume(user, payload.gameId);
    },
  );
};

export const gamePlugin = fp(plugin, {
  name: 'game-plugin',
  dependencies: ['websocket-plugin', 'event-bus-plugin', 'auth-plugin', 'config-plugin'],
});

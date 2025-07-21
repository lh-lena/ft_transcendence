import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyInstance, WSConnection } from 'fastify';
import createGameService from '../services/game.service.js';
import createGameSessionService from '../services/game-session.service.js';
import createGameDataService from '../services/game-data.service.js';
import createGameStateService from '../services/game-state.service.js';
import { User } from '../schemas/user.schema.js';
import { ClientEventPayload } from '../schemas/ws.schema.js';


const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  const gameSessionService = createGameSessionService(app);
  const gameDataService = createGameDataService(app);
  app.decorate('gameSessionService', gameSessionService);
  app.decorate('gameDataService', gameDataService);

  const gameStateService = createGameStateService(app);
  app.decorate('gameStateService', gameStateService);

  const gameService = createGameService(app);
  app.decorate('gameService', gameService);

  app.eventBus.on('game_start', async ({ user, payload }: { user: User; payload: ClientEventPayload<'game_start'> }) => {
    await app.gameService.handleStartGame(user, payload.gameId);
  });

  app.eventBus.on('game_update', ({ user, payload }: { user: User; payload: ClientEventPayload<'game_update'> }) => {
    app.gameService.handlePlayerInput(user, payload);
  });

  app.eventBus.on('game_leave', ({ user, payload }: { user: User; payload: ClientEventPayload<'game_leave'> }) => {
    app.gameService.handleGameLeave(user, payload.gameId);
  });

  app.eventBus.on('game_pause', ({ user, payload }: { user: User; payload: ClientEventPayload<'game_pause'> }) => {
    app.gameService.handleGamePause(user, payload.gameId);
  });

  app.eventBus.on('game_resume', ({ user, payload }: { user: User; payload: ClientEventPayload<'game_resume'> }) => {
    app.gameService.handleGameResume(user, payload.gameId);
  });
}

export const gamePlugin = fp(plugin, {
    name: 'game-plugin',
    dependencies: ['websocket-plugin', 'event-bus-plugin', 'auth-plugin', 'config-plugin']
});

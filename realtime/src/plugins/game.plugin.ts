import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyInstance, WSConnection } from 'fastify';
import createGameService from '../services/game.service.js';
import createGameSessionService from '../services/game-session.service.js';
import createGameDataService from '../services/game-data.service.js';

const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  const gameSessionService = createGameSessionService(app);
  const gameDataService = createGameDataService(app);
  app.decorate('gameSessionService', gameSessionService);
  app.decorate('gameDataService', gameDataService);

  const gameService = createGameService(app);
  app.decorate('gameService', gameService);
}

export const gamePlugin = fp(plugin, {
    name: 'game-plugin',
    dependencies: ['websocket-plugin']
});

import { FastifyInstance } from 'fastify';
import { authPlugin } from './auth.plugin.js';
import { websocketPlugin } from './ws.plugin.js';
import { configPlugin } from './config.plugin.js';
import { gamePlugin } from './game.plugin.js';

export const registerPlugins = async (app: FastifyInstance) => {
  try {

    app.register(configPlugin);

    await app.register(authPlugin);

    await app.register(websocketPlugin);

    app.register(gamePlugin);
    
    app.log.debug('All plugins registered successfully');
  } catch (err) {
    app.log.error('Error registering plugins:', err);
    throw err;
  }
};

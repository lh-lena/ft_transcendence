import type { FastifyInstance } from 'fastify';
import { configPlugin } from './config.plugin.js';
import { eventBusPlugin } from './eventBus.plugin.js';
import { authPlugin } from './auth.plugin.js';
import { websocketPlugin } from './ws.plugin.js';
import { aiPlugin } from './ai.plugin.js';
import { gamePlugin } from './game.plugin.js';
import { chatPlugin } from './chat.plugin.js';
import { apiPlugin } from './api.plugin.js';
import monitoringPlugin from './monitoring.plugin.js';
import { processErrorLog } from '../utils/error.handler.js';

export const registerPlugins = async (app: FastifyInstance): Promise<void> => {
  try {
    app.log.info('Registering plugins...');

    app.register(configPlugin);

    app.register(eventBusPlugin);

    app.register(authPlugin);

    app.register(websocketPlugin);

    app.register(aiPlugin);

    app.register(chatPlugin);

    await app.register(monitoringPlugin);

    app.register(gamePlugin);

    app.register(apiPlugin);

    app.log.info('All plugins registered');
  } catch (error: unknown) {
    processErrorLog(app, 'plugin', 'Error registering plugins: ', error);
  }
};

import fp from 'fastify-plugin';
import type { FastifyPluginCallback, FastifyInstance } from 'fastify';
import { EventEmitter } from 'events';

const plugin: FastifyPluginCallback = (app: FastifyInstance) => {
  const eventBus = new EventEmitter();
  eventBus.setMaxListeners(100);

  app.decorate('eventBus', eventBus);
};

export const eventBusPlugin = fp(plugin, {
  name: 'event-bus-plugin',
});

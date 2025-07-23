import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { EventEmitter } from 'events';

const plugin: FastifyPluginAsync = async (app) => {
  const eventBus = new EventEmitter();
  eventBus.setMaxListeners(100);

  app.decorate('eventBus', eventBus);
};

export const eventBusPlugin = fp(plugin, {
  name: 'event-bus-plugin',
});

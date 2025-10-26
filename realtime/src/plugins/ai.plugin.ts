import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import createAIService from '../ai/ai.service.js';

const plugin: FastifyPluginCallback = (app: FastifyInstance) => {
  const ai = createAIService(app);

  app.decorate('aiService', ai);
};

export const aiPlugin = fp(plugin, {
  name: 'ai-plugin',
  dependencies: ['config-plugin'],
});

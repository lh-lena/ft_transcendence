import Fastify, { type FastifyInstance } from 'fastify';
import { err, ok, type Result } from 'neverthrow';
import { parseConfig } from './config/server.config.js';
import { registerPlugins } from './plugins/index.js';

export const buildServer = async (): Promise<Result<FastifyInstance, unknown>> => {
  try {
    const config = parseConfig();

    const server = Fastify({
      logger: config.logger,
    });

    await registerPlugins(server);
    await server.ready();
    return ok(server);
  } catch (error: unknown) {
    return err(error);
  }
};

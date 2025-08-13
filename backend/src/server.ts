import Fastify from 'fastify';
import AutoLoad from '@fastify/autoload';

import Path from 'path';
import qs from 'qs';
import { errorHandler } from './utils/errorHandler';

//build server
export async function buildServer() {
  //build fastify instance
  const server = Fastify({
    querystringParser: (str) => qs.parse(str),
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });
  //}).withTypeProvider<ZodTypeProvider>();

  //  server.addHook('onRoute', (routeOptions) => {
  //   console.log('📦 Route registered:', routeOptions.method, routeOptions.url);
  //   if (routeOptions.schema) {
  //     console.log('🧪 Route schema:', JSON.stringify(routeOptions.schema, null, 2));
  //   }
  //  });

  server.register(AutoLoad, {
    dir: Path.join(__dirname, 'plugins'),
  });

  server.register(AutoLoad, {
    dir: Path.join(__dirname, 'routes'),
  });

  server.setErrorHandler(errorHandler);

  await server.ready();

  return server;
}

async function start() {
  try {
    const server = await buildServer();
    const PORT = parseInt(server.config.PORT);

    //start listening with the instance
    await server.listen({ port: PORT, host: server.config.HOST });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();

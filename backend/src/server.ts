import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';
import AutoLoad from '@fastify/autoload';
import Path from 'path';

import { errorHandler } from './utils/errorHandler';

async function build() {
  //build fastify instance
  const server = fastify({
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

  //  server.addHook('onRoute', (routeOptions) => {
  //    console.log('📦 Route registered:', routeOptions.method, routeOptions.url);
  //    if (routeOptions.schema) {
  //      console.log('🧪 Route schema:', JSON.stringify(routeOptions.schema, null, 2));
  //    }
  //  });
  server.register(fastifyStatic, {
    root: Path.join(__dirname, '../public'),
    prefix: '/',
  });

  server.register(cors, {
    origin: true,
  });

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

const start = async () => {
  const server = await build();

  try {
    const PORT = parseInt(process.env.PORT || '8080');
    const IP = process.env.IP || '0.0.0.0';
    await server.listen({ port: PORT, host: IP });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
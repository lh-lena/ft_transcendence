import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

import cors from '@fastify/cors';

const corsPlugin = async (server: FastifyInstance) => {
  //parse allowed origins
  const allowedOrigins = server.config.ALLOWED_ORIGINS
    ? server.config.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : [];

  const allowedMethods = server.config.ALLOWED_METHODS
    ? server.config.ALLOWED_METHODS.split(',')
        .map((method) => method.trim())
        .join(',')
    : [];

  const corsOptions = {
    origin: allowedOrigins,
    methods: allowedMethods,
    credentials: true,
  };

  await server.register(cors, corsOptions);
};

export default fp(corsPlugin);

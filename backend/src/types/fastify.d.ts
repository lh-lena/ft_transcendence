// src/types/fastify.d.ts
import 'fastify';
import { PrismaClient } from '@prisma/client';
import { schema } from '../plugins/000_config';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    config: typeof schema;
  }
}

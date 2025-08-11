// src/types/fastify.d.ts
import 'fastify';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    config: {
      PORT: string;
      HOST: string;
      ALLOWED_ORIGINS: string;
      ALLOWED_METHODS: string;
      DATABASE_URL: string;
    };
  }
}

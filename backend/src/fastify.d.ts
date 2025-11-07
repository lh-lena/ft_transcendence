/**
 * Fastify Type Augmentation
 */

import 'fastify';
import * as client from 'prom-client';
import { PrismaClient } from '@prisma/client';
import type { EnvConfig } from './schemas/config';
import { RealtimeService } from './utils/realtime';
import { createUserService } from './services/user';
import { createGameService } from './services/game';
import { createTournamentService } from './services/tournament';
import { createResultService } from './services/result';
import { createChatService } from './services/chat';
import { createBlockedService } from './services/blocked';
import { createFriendService } from './services/friend';

declare module 'fastify' {
  interface FastifyInstance {
    //config
    config: EnvConfig;

    //prisma
    prisma: PrismaClient;
    checkDatabaseHealth(): Promise<boolean>;

    //metrics
    metrics: {
      register: client.Registry;
      httpRequestDuration: client.Histogram<string>;
      dbConnectionStatus: client.Gauge<string>;
      backendServiceHealth: client.Gauge<string>;
    };

    //multipart file check
    validataeFileType(mimetype: string, allowedTypes: string[]): boolean;

    //realitme connection
    realtime: RealtimeService;

    //services
    services: {
      user: ReturnType<typeof createUserService>;
      game: ReturnType<typeof createGameService>;
      tournament: ReturnType<typeof createTournamentService>;
      result: ReturnType<typeof createResultService>;
      chat: ReturnType<typeof createChatService>;
      blocked: ReturnType<typeof createBlockedService>;
      friend: ReturnType<typeof createFriendService>;
    };
  }

  interface FastifyRequest {
    userId?: string;
    startTime?: number;
  }

  interface FastifyReply {
    success?<T = unknown>(data: T, message?: string): FastifyReply;
    error?(message: string, statusCode?: number): FastifyReply;
  }
}

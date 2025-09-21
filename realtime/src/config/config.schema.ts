import { z } from 'zod/v4';

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('production'),
  WS_PORT: z.coerce.number().int().min(1).max(65535).default(8081),
  WS_HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  WS_CONNECTION_TIMEOUT: z.coerce.number().int().positive().default(60_000),
  WS_HEARTBEAT_INTERVAL: z.coerce.number().int().positive().default(30_000),
  WS_PAUSE_TIMEOUT: z.coerce.number().int().positive().default(60_000),
  WS_MAX_CONNECTIONS: z.coerce.number().int().positive().default(100),

  BACKEND_URL: z.string().default('http://backend:8080'),
  AUTH_URL: z.string().default('http://auth-service:8082'),

  AI_INTERVAL: z.coerce.number().int().positive().default(1),
});

export type EnvironmentConfig = z.infer<typeof configSchema>;

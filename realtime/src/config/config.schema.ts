import { z } from 'zod';

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('production'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8081),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  WS_CONNECTION_TIMEOUT: z.coerce.number().int().positive().default(60_000),
  WS_HEARTBEAT_INTERVAL: z.coerce.number().int().positive().default(30_000),
  WS_PAUSE_TIMEOUT: z.coerce.number().int().positive().default(60_000),
  WS_MAX_CONNECTIONS: z.coerce.number().int().positive().default(100),

  BACKEND_URL: z.string().url().default('http://backend:8080'),
  AUTH_URL: z.string().url().default('http://auth-service:8082'),

  ALLOWED_ORIGINS: z
    .string()
    .transform((str) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .default(
      'http://localhost:3000,http://localhost:3001,http://127.0.0.1:5500,http://127.0.0.1:5000',
    ),

  ALLOWED_SERVICE_IPS: z
    .string()
    .transform((str) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .default('http://backend:8080'),

  AI_INTERVAL: z.coerce.number().int().positive().default(1000),
});

export type EnvironmentConfig = z.infer<typeof configSchema>;

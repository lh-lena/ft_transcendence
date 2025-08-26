import type {
  AIServiceConfig,
  EnvironmentConfig,
  LoggerConfig,
  WebsocketConfig,
} from './config.js';
import { configSchema } from './config.schema.js';

export function getLoggerConfig(): LoggerConfig {
  const env = configSchema.safeParse(process.env);
  if (!env.success) {
    return { level: 'info' } as LoggerConfig;
  }
  const logger: LoggerConfig = {
    level: env.data.LOG_LEVEL,
    ...(env.data.NODE_ENV === 'development' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }),
  };
  return logger;
}

export function parseConfig(): EnvironmentConfig {
  const env = configSchema.safeParse(process.env);
  if (!env.success) {
    throw new Error(`Invalid environment variables: ${env.error}`);
  }
  const config: EnvironmentConfig = {
    port: env.data.WS_PORT,
    host: env.data.WS_HOST,
    logger: getLoggerConfig(),
    websocket: {
      connectionTimeout: env.data.WS_CONNECTION_TIMEOUT,
      heartbeatInterval: env.data.WS_HEARTBEAT_INTERVAL,
      pauseTimeout: env.data.WS_PAUSE_TIMEOUT,
      maxConnections: env.data.WS_MAX_CONNECTIONS,
      backendUrl: env.data.BACKEND_URL,
      authUrl: env.data.AUTH_URL,
      allowedOrigins: env.data.ALLOWED_ORIGINS,
      allowedServiceIPs: env.data.ALLOWED_SERVICE_IPS,
    } as WebsocketConfig,
    ai: {
      interval: env.data.AI_INTERVAL,
    } as AIServiceConfig,
  };
  return config;
}

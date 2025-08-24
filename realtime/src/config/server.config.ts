import type {
  AIServiceConfig,
  EnvironmentConfig,
  LoggerConfig,
  WebsocketConfig,
} from './config.js';
import z from 'zod';
import { configSchema } from './config.schema.js';

function parseConfig(): EnvironmentConfig {
  try {
    const env = configSchema.parse(process.env);

    const config: EnvironmentConfig = {
      port: env.PORT,
      host: env.HOST,
      logger: {
        level: env.LOG_LEVEL,
        ...(env.NODE_ENV === 'development' && {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
        }),
      } as LoggerConfig,
      websocket: {
        connectionTimeout: env.WS_CONNECTION_TIMEOUT,
        heartbeatInterval: env.WS_HEARTBEAT_INTERVAL,
        pauseTimeout: env.WS_PAUSE_TIMEOUT,
        maxConnections: env.WS_MAX_CONNECTIONS,
        backendUrl: env.BACKEND_URL,
        authUrl: env.AUTH_URL,
        allowedOrigins: env.ALLOWED_ORIGINS,
        allowedServiceIPs: env.ALLOWED_SERVICE_IPS,
      } as WebsocketConfig,
      ai: {
        interval: env.AI_INTERVAL,
      } as AIServiceConfig,
    };
    return config;
  } catch (error) {
    console.error('Configuration validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

export const serverConfig = parseConfig();

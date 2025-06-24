interface LoggerConfig {
  level: string;
  transport?: {
    target: string;
    options: {
      colorize?: boolean;
      translateTime?: string;
      ignore?: string;
    };
  };
}

interface WebsocketConfig {
  connectionTimeout: number,
  heartbeatInterval: number,
  backendUrl: string;
  authUrl: string;
}

export interface EnvironmentConfig {
  port: number;
  host: string;
  logger: LoggerConfig;
  websocket: WebsocketConfig;
}

interface Config {
  development: EnvironmentConfig;
  production: EnvironmentConfig;
}

const environment: keyof Config = (process.env.NODE_ENV as keyof Config) || 'development';

const config: Config = {
  development: {
    port: 8081,
    host: '0.0.0.0',
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    },
    websocket: {
      connectionTimeout: 60_000,
      heartbeatInterval: 30_000,
      backendUrl: 'https://localhost:8080',
      authUrl: 'https://auth:8082',
    },
  },
  production: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8081,
    host: '0.0.0.0',
    logger: {
      level: 'info',
    },
    websocket: {
      connectionTimeout: 60_000,
      heartbeatInterval: 30_000,
      backendUrl: process.env.BACKEND_URL || 'https://localhost:8080',
      authUrl: process.env.AUTH_URL || 'https://auth:8082',
    },
  },
};

export const serverConfig: EnvironmentConfig = config[environment];
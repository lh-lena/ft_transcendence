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
  pauseTimeout: number;
  backendUrl: string;
  authUrl: string;
  allowedOrigins: string[];
  maxConnections: number
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
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8081,
    host: process.env.HOST || '0.0.0.0',
    logger: {
      level: process.env.LOG_LEVEL || 'debug',
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
      connectionTimeout: process.env.WS_CONNECTION_TIMEOUT ? parseInt(process.env.WS_CONNECTION_TIMEOUT, 10) : 60_000,
      heartbeatInterval: process.env.WS_HEARTBEAT_INTERVAL ? parseInt(process.env.WS_HEARTBEAT_INTERVAL, 10) : 30_000,
      pauseTimeout: process.env.WS_PAUSE_TIMEOUT ? parseInt(process.env.WS_PAUSE_TIMEOUT, 10) : 60_000,
      backendUrl: process.env.BACKEND_URL || 'https://127.0.0.1:8080',
      authUrl: process.env.AUTH_URL || 'https://127.0.0.1:8082',
      allowedOrigins: [
        ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
        'https://127.0.0.1:3000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:5501',
        'http://127.0.0.1:5502',
        'http://127.0.0.1:5503'
      ],
      maxConnections: process.env.WS_MAX_CONNECTIONS ? parseInt(process.env.WS_MAX_CONNECTIONS, 10) : 1000,
    },
  },
  production: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8081,
    host: process.env.HOST || '0.0.0.0',
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
    websocket: {
      connectionTimeout: process.env.WS_CONNECTION_TIMEOUT ? parseInt(process.env.WS_CONNECTION_TIMEOUT, 10) : 60_000,
      heartbeatInterval: process.env.WS_HEARTBEAT_INTERVAL ? parseInt(process.env.WS_HEARTBEAT_INTERVAL, 10) : 30_000,
      pauseTimeout: process.env.WS_PAUSE_TIMEOUT ? parseInt(process.env.WS_PAUSE_TIMEOUT, 10) : 60_000,
      backendUrl: process.env.BACKEND_URL || 'https://127.0.0.1:8080',
      authUrl: process.env.AUTH_URL || 'https://127.0.0.1:8082',
      allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : [process.env.ALLOWED_ORIGIN || 'https://127.0.0.1:3000'],
      maxConnections: process.env.WS_MAX_CONNECTIONS ? parseInt(process.env.WS_MAX_CONNECTIONS, 10) : 1000,
    },
  },
};

export const serverConfig: EnvironmentConfig = config[environment];
export interface LoggerConfig {
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

export interface WebsocketConfig {
  connectionTimeout: number;
  heartbeatInterval: number;
  pauseTimeout: number;
  backendUrl: string;
  authUrl: string;
  maxConnections: number;
}

export interface AIServiceConfig {
  interval: number;
}

export interface EnvironmentConfig {
  port: number;
  host: string;
  logger: LoggerConfig;
  websocket: WebsocketConfig;
  ai: AIServiceConfig;
}

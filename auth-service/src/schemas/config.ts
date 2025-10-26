/**
 * Environment Configuration Schema
 * @module config/schema
 */

export interface Config {
  NODE_ENV: 'development' | 'production';
  PORT: number;
  HOST: string;
  SHUTDOWN_TIMEOUT: number;
  ACCESS_SECRET: string;
  REFRESH_SECRET: string;
  OAUTH_CLIENT_ID: string;
  OAUTH_SECRET: string;
  AUTH_URL: string;
  FRONTEND_URL: string;
  REALTIME_URL: string;
  BACE_URL: string;
  ENABLE_METRICS: boolean;
  SLOW_REQUEST_TIME: number;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
}

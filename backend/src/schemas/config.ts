/**
 * Environment Configuration Schema
 *
 * This schema defines all environment variables with:
 * - Type validation
 * - Default values
 * - Required/optional flags
 * - Format validation
 *
 * @module config/schema
 */

export interface EnvConfig {
  NODE_ENV: 'development' | 'production';
  PORT: number;
  HOST: string;
  SHUTDOWN_TIMEOUT: number;
  DATBASE_URL: string;
  DATABASE_TYPE: 'sqlite';
  REALTIME_IP: string;
  REALTIME_PORT: string;
  REALTIME_TIMEOUT: number;
  REALTIME_RETRY_TRYS: number;
  MAX_FILES: number;
  MAX_FILE_SIZE: number;
  MAX_FIELDS: number;
  MAX_FIELD_SIZE: number;
  UPLOAD_DIR: string;
  AVATAR_DIR: string;
  LEADERBOARD_SIZE: number;
  ENABLE_SWAGGER: boolean;
  ENABLE_METRICS: boolean;
  SLOW_REQUEST_TIME: number;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
}

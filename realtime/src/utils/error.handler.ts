import { NotificationType } from '../constants/game.constants.js';
import { GameError } from './game.error.js';
import type { FastifyInstance } from 'fastify';
import type { RespondService } from '../websocket/types/ws.types.js';
import type { User, UserIdType } from '../schemas/user.schema.js';
import { z } from 'zod';
import { GAME_EVENTS, GameEventType } from '../constants/game.constants.js';

function logMessage(
  app: FastifyInstance,
  level: 'error' | 'debug' | 'info',
  service: string,
  message: string,
  details?: string,
): void {
  app.log[level](`[${service}] ${message} ${details}`);
}

export function processErrorLog(
  app: FastifyInstance,
  service: string,
  message: string = '',
  error?: unknown,
): void {
  logMessage(app, 'error', service, message, safeErrorToString(error));
}

export function processDebugLog(
  app: FastifyInstance,
  service: string,
  message: string = '',
  error?: unknown,
): void {
  logMessage(app, 'debug', service, message, safeErrorToString(error));
}

export function processInfoLog(app: FastifyInstance, service: string, message: string = ''): void {
  logMessage(app, 'info', service, message);
}

export function safeErrorToString(error?: unknown): string {
  if (error === undefined || error === null) {
    return '';
  }
  if (error instanceof z.ZodError) {
    return error.errors.map((err) => err.message).join(', ');
  }
  if (error instanceof Error || error instanceof GameError) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return '';
    }
  }
  return String(error);
}

function sendErrorResponse(
  respond: RespondService,
  userId: UserIdType,
  type: GameEventType,
  message: string,
  notificationType?: NotificationType,
): void {
  if (type === GAME_EVENTS.NOTIFICATION && notificationType !== undefined) {
    respond.notification(userId, notificationType, message);
  } else {
    respond.error(userId, message);
  }
}

export function handleWebSocketError(
  error: unknown,
  userId: UserIdType,
  message: string,
  app: FastifyInstance,
): void {
  const respond = app.respond as RespondService;
  const errorMsg = safeErrorToString(error);

  if (error instanceof SyntaxError) {
    logMessage(
      app,
      'error',
      'websocket-service',
      `Invalid JSON message from user ${userId}`,
      message,
    );
    sendErrorResponse(respond, userId, GAME_EVENTS.ERROR, `Invalid JSON format: ${error.message}`);
  } else if (error instanceof GameError) {
    logMessage(app, 'error', 'websocket-service', `Game error for user ${userId}`, error.message);
    sendErrorResponse(
      respond,
      userId,
      GAME_EVENTS.NOTIFICATION,
      error.message,
      NotificationType.ERROR,
    );
  } else if (error instanceof Error) {
    logMessage(
      app,
      'error',
      'websocket-service',
      `Error processing message from user ${userId}`,
      error.message,
    );
    sendErrorResponse(
      respond,
      userId,
      GAME_EVENTS.ERROR,
      `Error processing message: ${error.message}`,
    );
  } else {
    logMessage(app, 'error', 'websocket-service', `Unknown error for user ${userId}`, errorMsg);
    sendErrorResponse(respond, userId, GAME_EVENTS.ERROR, 'Unknown error occurred');
  }
}

export function processGameError(
  app: FastifyInstance,
  user: User,
  service: string,
  message: string = '',
  error?: unknown,
): void {
  if (app === null || app === undefined || user === null || user === undefined) return;

  const respond = app.respond as RespondService;
  const { userId } = user;
  const errorMsg = safeErrorToString(error);

  if (error instanceof GameError) {
    sendErrorResponse(respond, userId, GAME_EVENTS.NOTIFICATION, errorMsg, NotificationType.WARN);
    if (error.error === undefined) {
      logMessage(app, 'debug', service, message, errorMsg);
      return;
    }
    logMessage(app, 'error', service, message, errorMsg);
  } else if (error instanceof Error) {
    sendErrorResponse(respond, userId, GAME_EVENTS.ERROR, errorMsg);
    logMessage(app, 'error', service, message, errorMsg);
  } else {
    logMessage(app, 'error', service, message, errorMsg);
  }
}

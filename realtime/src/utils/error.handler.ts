import { NotificationType } from '../constants/game.constants.js';
import { GameError } from './game.error.js';
import type { FastifyInstance } from 'fastify';
import type { RespondService } from '../websocket/types/ws.types.js';
import type { User } from '../schemas/user.schema.js';
import { z } from 'zod';

function formatLogDetails(details?: string): string {
  return details !== undefined && details !== null && details.trim() !== '' ? `: ${details}` : '';
}

function logMessage(
  app: FastifyInstance,
  level: 'error' | 'debug',
  service: string,
  message: string,
  details?: string,
): void {
  const detailsText = formatLogDetails(details);
  app.log[level](`[${service}] ${message} ${detailsText}`);
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

export function safeErrorToString(error: unknown): string {
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
  userId: number,
  type: 'error' | 'notification',
  message: string,
  notificationType?: NotificationType,
): void {
  if (type === 'notification' && notificationType !== undefined) {
    respond.notification(userId, notificationType, message);
  } else {
    respond.error(userId, message);
  }
}

export function handleWebSocketError(
  error: unknown,
  userId: number,
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
    sendErrorResponse(respond, userId, 'error', `Invalid JSON format: ${error.message}`);
  } else if (error instanceof GameError) {
    logMessage(app, 'error', 'websocket-service', `Game error for user ${userId}`, error.message);
    sendErrorResponse(respond, userId, 'notification', error.message, NotificationType.ERROR);
  } else if (error instanceof Error) {
    logMessage(
      app,
      'error',
      'websocket-service',
      `Error processing message from user ${userId}`,
      error.message,
    );
    sendErrorResponse(respond, userId, 'error', `Error processing message: ${error.message}`);
  } else {
    logMessage(app, 'error', 'websocket-service', `Unknown error for user ${userId}`, errorMsg);
    sendErrorResponse(respond, userId, 'error', 'Unknown error occurred');
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
  const responseMsg = message + errorMsg;

  if (error instanceof GameError) {
    sendErrorResponse(respond, userId, 'notification', errorMsg, NotificationType.WARN);
    logMessage(app, 'debug', service, message, errorMsg);
  } else if (error instanceof Error) {
    sendErrorResponse(respond, userId, 'error', responseMsg);
    logMessage(app, 'error', service, message, errorMsg);
  } else {
    logMessage(app, 'error', service, message, errorMsg);
  }
}

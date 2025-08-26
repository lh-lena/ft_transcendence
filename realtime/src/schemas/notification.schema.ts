import { NotificationType } from '../constants/game.constants.js';

export const NotificationParamsSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
  },
  required: ['id'],
};

export const NotificationRequestSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', minLength: 1 },
    type: {
      type: 'string',
      enum: [NotificationType.INFO, NotificationType.WARN, NotificationType.ERROR],
      default: NotificationType.INFO,
    },
  },
  required: ['message'],
};

export const NotificationResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
  required: ['success'],
};

export type NotificationParams = {
  id: number;
};

export type NotificationRequest = {
  message: string;
  tt: NotificationType;
};

export type NotificationResponse = {
  success: boolean;
  message: string;
};

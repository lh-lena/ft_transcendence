import { NotificationType } from '../constants/game.constants.js';
import type { UserIdType } from './user.schema.js';

export const NotificationRequestSchema = {
  type: 'object',
  properties: {
    reciver: { type: 'string', format: 'uuid' },
    sender: { type: 'string', format: 'uuid' },
    payload: {
      type: 'object',
      properties: {
        message: { type: 'string', minLength: 1 },
      },
      required: ['message'],
    },
    event: {
      type: 'string',
      enum: [NotificationType.INFO, NotificationType.WARN, NotificationType.ERROR],
      default: NotificationType.INFO,
    },
  },
  required: ['reciver', 'sender', 'payload'],
};

export const NotificationResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
  required: ['success'],
};

export type NotificationRequest = {
  event: NotificationType;
  reciver: UserIdType;
  sender: UserIdType;
  payload: { message: string };
};

export type NotificationResponse = {
  success: boolean;
  message: string;
};

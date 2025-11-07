import { NotificationType } from '../constants/game.constants.js';
import type { UserIdType } from './user.schema.js';

export const NotificationRequestSchema = {
  type: 'object',
  properties: {
    reciever: { type: 'string', format: 'uuid' },
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
  required: ['reciever', 'sender', 'payload'],
};

export type NotificationRequest = {
  event: NotificationType;
  reciever: UserIdType;
  sender: UserIdType;
  payload: { message: string };
};

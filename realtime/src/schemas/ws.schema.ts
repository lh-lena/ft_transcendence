import { z } from 'zod/v4';
import { Direction, NotificationType, GAME_EVENTS } from '../constants/game.constants.js';
import type { GameStateSchema, GameResultSchema } from './game.schema.js';
import { GameIdSchema } from './game.schema.js';
import { ChatMessagePayloadSchema, ChatMessageBroadcastSchema } from './chat.schema.js';
import { UserIdSchema } from './user.schema.js';
import { CHAT_EVENTS } from '../constants/chat.constants.js';

export const GameIdPayloadSchema = z.object({
  gameId: GameIdSchema,
});

export const GameLeavePayloadSchema = z.object({
  gameId: GameIdSchema,
});

export const PlayerInputSchema = z.object({
  gameId: GameIdSchema,
  direction: z.enum(Direction),
  sequence: z.number().default(0),
});

export const GamePausePayloadSchema = z.object({
  gameId: GameIdSchema,
  reason: z.string(),
});

export const NotificationPayloadSchema = z.object({
  type: z.enum(NotificationType),
  message: z.string(),
  timestamp: z.number().int(),
});

export const ConnectedPayloadSchema = z.object({
  userId: UserIdSchema,
});

export const GamePauseBroadcastSchema = z.object({
  gameId: GameIdSchema,
  reason: z.string(),
});

export const CountdownUpdateSchema = z.object({
  gameId: GameIdSchema,
  countdown: z.number().min(0),
  message: z.string(),
});

export const ErrorPayloadSchema = z.object({
  message: z.string(),
});

export const WsClientMessageSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal(GAME_EVENTS.START),
    payload: GameIdPayloadSchema,
  }),
  z.object({
    event: z.literal(GAME_EVENTS.LEAVE),
    payload: GameIdPayloadSchema,
  }),
  z.object({
    event: z.literal(GAME_EVENTS.UPDATE),
    payload: PlayerInputSchema,
  }),
  z.object({
    event: z.literal(GAME_EVENTS.PAUSE),
    payload: GameIdPayloadSchema,
  }),
  z.object({
    event: z.literal(GAME_EVENTS.RESUME),
    payload: GameIdPayloadSchema,
  }),
  z.object({
    event: z.literal(GAME_EVENTS.NOTIFICATION),
    payload: NotificationPayloadSchema,
  }),
  z.object({
    event: z.literal(CHAT_EVENTS.MESSAGE),
    payload: ChatMessagePayloadSchema,
  }),
]);

export interface WsServerBroadcast {
  connected: z.infer<typeof ConnectedPayloadSchema>;
  game_update: z.infer<typeof GameStateSchema>;
  game_ended: z.infer<typeof GameResultSchema>;
  game_pause: z.infer<typeof GamePauseBroadcastSchema>;
  countdown_update: z.infer<typeof CountdownUpdateSchema>;
  notification: z.infer<typeof NotificationPayloadSchema>;
  error: z.infer<typeof ErrorPayloadSchema>;
  chat_message: z.infer<typeof ChatMessageBroadcastSchema>;
}

export type ClientEventPayload<T extends WsClientMessage['event']> = Extract<
  WsClientMessage,
  { event: T }
>['payload'];

export type WsClientMessage = z.infer<typeof WsClientMessageSchema>;
export type PlayerInput = z.infer<typeof PlayerInputSchema>;
export type ConnectedPayload = z.infer<typeof ConnectedPayloadSchema>;
export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;

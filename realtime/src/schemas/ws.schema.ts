import { z } from 'zod/v4';
import { Direction, NotificationType, GAME_EVENTS } from '../constants/game.constants.js';
import { GameStateSchema, GameResultSchema } from './game.schema.js';
import { GameIdSchema } from './game.schema.js';
import { ChatMessagePayloadSchema, ChatMessageBroadcastSchema } from './chat.schema.js';
import { UserIdObjectSchema, UserIdSchema } from './user.schema.js';
import { CHAT_EVENTS } from '../constants/chat.constants.js';

export const GameIdPayloadSchema = z
  .object({
    gameId: GameIdSchema,
  })
  .meta({ $id: 'GameIdPayload' });

export const GameLeavePayloadSchema = z
  .object({
    gameId: GameIdSchema,
  })
  .meta({ $id: 'GameLeavePayload' });

export const PlayerInputSchema = z
  .object({
    gameId: GameIdSchema,
    direction: z.enum(Direction),
    sequence: z.number().min(0),
  })
  .meta({ $id: 'PlayerInputPayload' });

export const GamePausePayloadSchema = z
  .object({
    gameId: GameIdSchema,
    reason: z.string(),
  })
  .meta({ $id: 'GamePausePayload' });

export const NotificationPayloadSchema = z
  .object({
    type: z.enum(NotificationType),
    message: z.string(),
    timestamp: z.number().int(),
  })
  .meta({ $id: 'NotificationPayload' });

export const ConnectedPayloadSchema = z
  .object({
    userId: UserIdSchema,
  })
  .meta({ $id: 'ConnectedPayload' });

export const GameStartedPayloadSchema = z
  .object({
    gameId: GameIdSchema,
    players: z.array(UserIdObjectSchema),
  })
  .meta({ $id: 'GameStartedPayload' });

export const GamePauseBroadcastSchema = z
  .object({
    gameId: GameIdSchema,
    reason: z.string(),
  })
  .meta({ $id: 'GamePausePayload' });

export const CountdownUpdateSchema = z
  .object({
    gameId: GameIdSchema,
    countdown: z.number().min(0),
    message: z.string(),
  })
  .meta({ $id: 'CountdownUpdatePayload' });

export const ErrorPayloadSchema = z
  .object({
    message: z.string(),
  })
  .meta({ $id: 'ErrorPayload' });

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
  game_start: z.infer<typeof GameStartedPayloadSchema>;
  game_update: z.infer<typeof GameStateSchema>;
  game_ended: z.infer<typeof GameResultSchema>;
  game_pause: z.infer<typeof GamePauseBroadcastSchema>;
  countdown_update: z.infer<typeof CountdownUpdateSchema>;
  notification: z.infer<typeof NotificationPayloadSchema>;
  error: z.infer<typeof ErrorPayloadSchema>;
  chat_message: z.infer<typeof ChatMessageBroadcastSchema>;
}

export const WsServerBroadcastSchemas = {
  connected: ConnectedPayloadSchema,
  game_start: GameStartedPayloadSchema,
  game_update: GameStateSchema,
  game_ended: GameResultSchema,
  game_pause: GamePauseBroadcastSchema,
  countdown_update: CountdownUpdateSchema,
  notification: NotificationPayloadSchema,
  error: ErrorPayloadSchema,
  chat_message: ChatMessageBroadcastSchema,
} as const;

export type ClientEventPayload<T extends WsClientMessage['event']> = Extract<
  WsClientMessage,
  { event: T }
>['payload'];

export type WsClientMessage = z.infer<typeof WsClientMessageSchema>;
export type PlayerInput = z.infer<typeof PlayerInputSchema>;
export type ConnectedPayload = z.infer<typeof ConnectedPayloadSchema>;
export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;

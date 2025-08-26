import type { FastifyInstance } from 'fastify';
import type { User } from '../schemas/user.schema.js';
import type { ChatMessagePayload } from '../schemas/chat.schema.js';
import type { ChatService } from './chat.js';
import type { RespondService } from '../websocket/types/ws.types.js';

export function createChatService(app: FastifyInstance): ChatService {
  function handleChatMessage(user: User, payload: ChatMessagePayload): void {
    const { log } = app;
    const respond = app.respond as RespondService;
    const { userId, timestamp } = payload;

    log.debug(
      `[chat-service] User ${user.username} ID: ${user.userId} sent message to ${userId} at ${timestamp}`,
    );
    respond.chatMessage(userId);
  }

  return {
    handleChatMessage,
  };
}

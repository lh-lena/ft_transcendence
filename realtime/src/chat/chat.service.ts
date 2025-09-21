import type { FastifyInstance } from 'fastify';
import type { User } from '../schemas/user.schema.js';
import type { ChatMessagePayload, ChatMessage } from '../schemas/chat.schema.js';
import type { ChatService } from './chat.js';
import type { RespondService } from '../websocket/types/ws.types.js';
import { processErrorLog } from '../utils/error.handler.js';
import { EnvironmentConfig } from '../config/config.js';

export function createChatService(app: FastifyInstance): ChatService {
  const { log } = app;
  const config = app.config as EnvironmentConfig;
  const BACKEND_URL = config.websocket.backendUrl;
  async function handleChatMessage(user: User, payload: ChatMessagePayload): Promise<void> {
    const respond = app.respond as RespondService;
    const { reciverId, message } = payload;
    const senderId = user.userId;
    log.debug(`[chat-service] Handling chat message from ${senderId} to ${reciverId}`);
    const toSave = {
      senderId,
      reciverId,
      message,
    };
    const saved = await saveChatMessage(toSave);
    if (saved) {
      const broadcastMessage = {
        senderId,
        message,
        timestamp: new Date().toISOString(),
      };
      respond.chatMessage(reciverId, broadcastMessage);
    }
  }

  async function saveChatMessage(message: ChatMessage): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      if (res.status === 201) {
        return true;
      }
      return false;
    } catch (error: unknown) {
      processErrorLog(app, 'chat-service', `Failed to save chat message:`, error);
      return false;
    }
  }

  return {
    handleChatMessage,
  };
}

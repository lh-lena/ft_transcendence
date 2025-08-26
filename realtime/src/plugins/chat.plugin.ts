import fp from 'fastify-plugin';
import type { FastifyPluginCallback, FastifyInstance } from 'fastify';
import type { User } from '../schemas/user.schema.js';
import type { ClientEventPayload } from '../schemas/ws.schema.js';
import { createChatService } from '../chat/chat.service.js';

const plugin: FastifyPluginCallback = (app: FastifyInstance) => {
  const chatService = createChatService(app);

  app.decorate('chatService', chatService);
  app.eventBus.on(
    'chat_message',
    ({ user, payload }: { user: User; payload: ClientEventPayload<'chat_message'> }) => {
      chatService.handleChatMessage(user, payload);
    },
  );
};

export const chatPlugin = fp(plugin, {
  name: 'chat-plugin',
  dependencies: ['websocket-plugin', 'event-bus-plugin', 'auth-plugin', 'config-plugin'],
});

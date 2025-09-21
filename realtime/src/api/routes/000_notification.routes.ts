import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { RespondService } from '../../websocket/types/ws.types.js';
import {
  NotificationRequestSchema,
  NotificationResponseSchema,
} from '../../schemas/notification.schema.js';
import type { NotificationRequest } from '../../schemas/notification.schema.js';
import { processErrorLog } from '../../utils/error.handler.js';

export const setupNotificationRoutes = (server: FastifyInstance): void => {
  const respond = server.respond as RespondService;

  server.post('/notify', {
    schema: {
      body: NotificationRequestSchema,
      response: {
        200: NotificationResponseSchema,
        500: NotificationResponseSchema,
      },
    },
    handler: (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { reciever, payload, event } = request.body as NotificationRequest;
        const res = respond.notification(reciever, event, payload.message);
        return reply.code(200).send({ success: res });
      } catch (error: unknown) {
        processErrorLog(
          server,
          'notification-routes',
          'Error processing notification request:',
          error,
        );

        return reply.code(500).send({
          success: false,
          message: 'Internal server error while processing notification',
        });
      }
    },
  });
};

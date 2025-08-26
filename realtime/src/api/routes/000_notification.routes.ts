import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AuthService } from '../../auth/auth.js';
import type { RespondService } from '../../websocket/types/ws.types.js';
import {
  NotificationRequestSchema,
  NotificationResponseSchema,
  NotificationParamsSchema,
} from '../../schemas/notification.schema.js';
import type { NotificationParams, NotificationRequest } from '../../schemas/notification.schema.js';
import { processErrorLog } from '../../utils/error.handler.js';

export const setupNotificationRoutes = (server: FastifyInstance): void => {
  const auth = server.auth as AuthService;
  const respond = server.respond as RespondService;

  server.post('/notifications/:id', {
    preHandler: (request, reply, done) => auth.verifyServerOrigin(request, reply, done),
    schema: {
      params: NotificationParamsSchema,
      body: NotificationRequestSchema,
      response: {
        200: NotificationResponseSchema,
      },
    },
    handler: (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id: userId } = request.params as NotificationParams;
        const data = request.body as NotificationRequest;

        const res = respond.notification(userId, data.tt, data.message);

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

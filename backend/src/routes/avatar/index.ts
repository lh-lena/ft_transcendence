import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import path from 'path';
import { createReadStream } from 'fs';
import { promises as fs } from 'fs';
import { cleanFilename } from '../../utils/fileUtils';

import type { userIdType } from '../../schemas/user';

const avatarRoute = async (server: FastifyInstance) => {
  const AVATAR_DIR = server.config.AVATAR_DIR;
  /**
   * Get User Avatar Endpoint
   *
   * Retrieves and streams a user's avatar image.
   */
  server.get('/:userId', {
    schema: {
      summary: 'Get uploaded avatar',
      description: "Retrieve user's avatar image.",
      tags: ['user'],
      params: { $ref: 'userId' },
      response: {
        200: {
          description: 'Image file',
          type: 'string',
          format: 'binary',
        },
        404: {
          description: 'No avatar found',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as userIdType;
      const user = await server.services.user.getById({ userId: params.userId });

      if (!user || !user.avatar) {
        return reply.status(404).send({ error: 'No avatar found for this user' });
      }

      const cleanFileName = cleanFilename(user.avatar);
      const avatarPath = path.join(AVATAR_DIR, cleanFileName);

      await fs.access(avatarPath);

      const ext = path.extname(cleanFileName).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };
      const contentType = contentTypeMap[ext] || 'image/png';

      return reply.header('Content-Type', contentType).send(createReadStream(avatarPath));
    },
  });
};

export default avatarRoute;

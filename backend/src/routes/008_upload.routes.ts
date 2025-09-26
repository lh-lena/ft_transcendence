import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import fp from 'fastify-plugin';
import path from 'path';
import fs from 'fs';

import { v4 as uuid } from 'uuid';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

import { userService } from '../modules/user/user.service';
import { userIdType } from '../schemas/user';

import { FileValidator } from '../utils/fileValidator';

const validator = new FileValidator();

const uploadRoutes = async (server: FastifyInstance) => {
  server.post(
    '/api/upload',
    {
      schema: {
        summary: 'Upload an image',
        description:
          'Endpoint to upload a png image. Validates the file and stores it on the server. Returns the upload path to eg. add to user',
        tags: ['upload'],
        consumes: ['multipart/form-data'],
        response: {
          200: {
            description: 'Successful upload',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              originalName: { type: 'string' },
              storedName: { type: 'string' },
              mimetype: { type: 'string' },
              encoding: { type: 'string' },
              path: { type: 'string' },
            },
          },
          400: {
            description: 'Upload failed',
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file();

      if (!data) return reply.status(400).send({ error: 'No file uploaded' });

      const validation = validator.validateFile(data.filename);

      if (!validation.valid)
        return reply.status(400).send({
          error: 'File validation failed',
          deatils: validation.errors,
        });

      const ext = data.filename.substring(data.filename.lastIndexOf('.'));
      const uniqeName = `${uuid()}${ext}`;
      const filePath = `./public/avatars/${uniqeName}`;

      await pipeline(data.file, createWriteStream(filePath));

      return {
        success: true,
        originalName: data.filename,
        storedName: uniqeName,
        mimetype: data.mimetype,
        encoding: data.encoding,
        path: filePath,
      };
    },
  );

  server.post(
    '/api/upload/github',
    {
      schema: {
        summary: 'Download and store GitHub avatar',
        description: 'Downloads avatar from GitHub and stores it locally',
        tags: ['upload'],
        body: {
          type: 'object',
          required: ['githubAvatarUrl'],
          properties: {
            githubAvatarUrl: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Successful GitHub avatar download',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              originalName: { type: 'string' },
              storedName: { type: 'string' },
              mimetype: { type: 'string' },
              path: { type: 'string' },
            },
          },
          400: {
            description: 'Download failed',
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { githubAvatarUrl } = request.body as { githubAvatarUrl: string };

      try {
        if (!isValidGitHubAvatarUrl(githubAvatarUrl)) {
          return reply.status(400).send({ error: 'Invalid gitHub avatar URL' });
        }

        const response = await fetch(githubAvatarUrl);
        if (!response.ok) {
          return reply.status(400).send({ error: 'Failed to fetch avatar' });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        if (!contentType.startsWith('image/')) {
          return reply.status(400).send({ error: 'Invalid content tyep' });
        }

        const ext = getExtensionFromContentType(contentType);
        const uniqueName = `github_${uuid()}${ext}`;
        const filePath = `./public/avatars/${uniqueName}`;

        const buffer = await response.arrayBuffer();
        const fileStream = createWriteStream(filePath);
        fileStream.write(Buffer.from(buffer));
        fileStream.end();

        return {
          success: true,
          originalName: `github-avatar${ext}`,
          storedName: uniqueName,
          mimetype: contentType,
          path: filePath,
        };
      } catch (error) {
        return reply.status(400).send({
          error: 'Failed to download GitHub avatar',
          details: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    },
  );

  function isValidGitHubAvatarUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const validDomains = ['avatars.githubusercontent.com', 'github.com'];
      return validDomains.includes(parsedUrl.hostname) && parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function getExtensionFromContentType(contentType: string): string {
    const typeMap: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    return typeMap[contentType.toLowerCase()] || '.jpg';
  }

  server.get(
    '/api/avatar/:userId',
    {
      schema: {
        summary: 'Get teh uploaded Avatar',
        description: 'Endpoint to get the avatar img.',
        tags: ['user'],
        params: { $ref: `userId` },
        response: {
          200: {
            description: 'Image file',
            type: 'string',
            format: 'binary',
          },
          404: {
            description: 'No Avatar found',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.params as userIdType;
        const user = await userService.getById(userId.userId);

        if (!user || !user.avatar) {
          return reply.status(404).send({ error: 'No avatar found' });
        }
        const cleanFileName = validator.cleanFilename(user.avatar);
        const url = path.join(__dirname, '../../public/avatars', cleanFileName);

        if (!fs.existsSync(url)) {
          return reply.code(404).send({ error: 'No avatar found' });
        }

        return reply.header('Content-Type', 'image/png').send(fs.createReadStream(url));
      } catch {
        return reply.code(404).send({ error: 'No avatar found' });
      }
    },
  );
};

export default fp(uploadRoutes);

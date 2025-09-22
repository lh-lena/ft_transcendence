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
        summary: 'Upload an png image',
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
      const userId = request.params as userIdType;
      const user = await userService.getById(userId.userId);

      if (!user || !user.avatar) {
        return reply.status(404).send({ error: 'No avatar found' });
      }
      const cleanFileName = validator.cleanFilename(user.avatar);
      const url = path.join(__dirname, '../public', cleanFileName);

      if (!fs.existsSync(url)) {
        reply.code(404).send({ error: 'No avatar found' });
      }

      reply.header('Content-Type', 'image/png');
      return reply.send(fs.createReadStream(url));
    },
  );
};

export default fp(uploadRoutes);

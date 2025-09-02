import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { v4 as uuid } from 'uuid';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

import { FileValidator } from '../utils/fileValidator';

const validator = new FileValidator();

const uploadRoutes = async (server: FastifyInstance) => {
  server.post(
    '/api/upload',
    {
      schema: {
        summary: 'Upload an avatar image',
        description:
          'Endpoint to upload a user avatar image. Validates the file and stores it on the server.',
        tags: ['Avatar'],
        consumes: ['multipart/form-data'],
        body: {
          type: 'object',
          properties: {
            file: { type: 'string', format: 'binary' },
          },
          required: ['file'],
        },
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
};

export default fp(uploadRoutes);

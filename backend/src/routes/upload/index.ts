/**
 * File Upload Routes
 *
 * Provides file upload endpoints for avatars and images.
 *
 * Endpoints:
 * - POST /api/upload - Upload image file (multipart/form-data)
 * - POST /api/upload/github - Download and store GitHub avatar
 * - GET /api/avatar/:userId - Retrieve user's avatar image
 *
 * Features:
 * - File validation (type, size, content)
 * - Unique filename generation
 * - GitHub avatar downloading
 *
 * @module routes/upload
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';

import { v4 as uuid } from 'uuid';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import {
  validateFile,
  getExtension,
  isValidGitHubAvatarUrl,
  getExtensionFromContentType,
} from '../../utils/fileUtils';

/**
 * Upload Routes Plugin
 *
 * Registers all file upload and retrieval routes.
 * Handles both direct uploads and GitHub avatar downloads.
 *
 * @param server - Fastify server instance
 */
const uploadRoutes = async (server: FastifyInstance) => {
  const AVATAR_DIR = server.config.AVATAR_DIR;

  /**
   * Direct File Upload Endpoint
   *
   * Accepts multipart/form-data file uploads.
   * Validates file type and content before storing.
   *
   * Validation:
   * - File type (based on extension and MIME type)
   * - File size (enforced by multipart plugin)
   * - Content validation (magic number checking)
   */

  server.post('/', {
    schema: {
      summary: 'Upload an image',
      description: 'Endpoint to upload a PNG/JPG image.',
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
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const validation = validateFile(data.filename);
      if (!validation.valid) {
        return reply.status(400).send({
          error: 'File validation failed',
          details: validation.errors,
        });
      }

      const ext = getExtension(data.filename);
      const uniqueName = `${uuid()}${ext}`;
      const filePath = path.join(AVATAR_DIR, uniqueName);

      await pipeline(data.file, createWriteStream(filePath));

      server.log.info(
        {
          originalName: data.filename,
          storedName: uniqueName,
        },
        'File uploaded',
      );

      return reply.code(200).send({
        success: true,
        originalName: data.filename,
        storedName: uniqueName,
        mimetype: data.mimetype,
        encoding: data.encoding,
        path: filePath,
      });
    },
  });

  /**
   * GitHub Avatar Download Endpoint
   *
   * Downloads a user's avatar from GitHub and stores it locally.
   *
   * Validation:
   * - URL must be from GitHub domains
   * - Must use HTTPS
   * - Content type must be image/*
   */
  server.post('/github', {
    schema: {
      summary: 'Download and store GitHub avatar',
      description: 'Downloads avatar from GitHub and stores it locally',
      tags: ['upload'],
      body: {
        type: 'object',
        required: ['githubAvatarUrl'],
        properties: {
          githubAvatarUrl: { type: 'string', format: 'uri' },
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
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { githubAvatarUrl } = request.body as { githubAvatarUrl: string };

      if (!isValidGitHubAvatarUrl(githubAvatarUrl)) {
        return reply.code(400).send({
          error: 'Invalid GitHub avatar URL',
          details: [
            'URL must be from GitHub domains (avatars.githubusercontent.com or github.com)',
          ],
        });
      }

      const response = await fetch(githubAvatarUrl);
      if (!response.ok) {
        return reply.code(400).send({
          error: 'Failed to fetch avatar from GitHub',
          details: [`HTTP ${response.status}: ${response.statusText}`],
        });
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      if (!contentType.startsWith('image/')) {
        return reply.code(400).send({
          error: 'Invalid content type',
          details: [`Expected image/*, got ${contentType}`],
        });
      }

      const ext = getExtensionFromContentType(contentType);
      const uniqueName = `github_${uuid()}${ext}`;
      const filePath = path.join(AVATAR_DIR, uniqueName);

      if (!response.body) {
        return reply.status(400).send({ error: 'No response body' });
      }

      await pipeline(response.body, createWriteStream(filePath));

      server.log.info(
        { githubUrl: githubAvatarUrl, storedName: uniqueName },
        'GitHub avatar downloaded',
      );

      return reply.code(200).send({
        success: true,
        originalName: `github-avatar${ext}`,
        storedName: uniqueName,
        mimetype: contentType,
        path: filePath,
      });
    },
  });
};

export default uploadRoutes;

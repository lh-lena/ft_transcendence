/**
 * Multipart/Form-Data Plugin
 *
 * Enables handling of multipart form uploads (files and form fields).
 * Configures security limits to prevent DoS attacks.
 *
 * Features:
 * - File upload support
 * - Configurable size limits
 * - Security boundaries
 * - Automatic stream handling
 *
 * Usage in routes:
 * const data = await request.file() // Single file
 * const parts = request.parts() // Multiple files/fields
 *
 * Limits:
 * - Max file size: 10MB
 * - Max files: 1 per request
 * - Max fields: 10 per request
 * - Max field size: 1MB
 *
 * @module plugins/multipart
 */

import fp from 'fastify-plugin';
import fastifyMultipart from '@fastify/multipart';
import { FastifyInstance } from 'fastify';

/**
 * Multipart Form Plugin
 *
 * Enables multipart/form-data parsing with security limits.
 * Prevents DoS attacks via oversized uploads.
 *
 * @param server - Fastify server instance
 */
const multipartPlugin = async (server: FastifyInstance) => {
  const { MAX_FILE_SIZE, MAX_FILES, MAX_FIELD_SIZE, MAX_FIELDS } = server.config;

  await server.register(fastifyMultipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: MAX_FIELD_SIZE,
      fields: MAX_FIELDS,
      fileSize: MAX_FILE_SIZE,
      files: MAX_FILES,
      headerPairs: 2000,
      parts: MAX_FILES + MAX_FIELDS,
    },
    attachFieldsToBody: false,
    sharedSchemaId: '#multipartFile',
  });

  server.log.info('Multipart plugin registered with security limits');

  server.decorate('validateFileType', (mimetype: string, allowedTypes: string[]): boolean => {
    return allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        return mimetype.startsWith(type.slice(0, -2));
      }
      return mimetype === type;
    });
  });
};

export default fp(multipartPlugin, {
  name: 'multipart',
  fastify: '5.x',
  dependencies: ['config'],
});

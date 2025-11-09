/**
 * Token Blacklist Routes
 *
 * Provides endpoints for managing blacklisted tokens (e.g., for logout).
 *
 * Endpoints:
 * - POST /api/blacklist - Add token to blacklist
 * - GET /api/blacklist?token=xxx - Check if token is blacklisted
 *
 * Features:
 * - Token blacklisting for logout
 * - Duplicate prevention
 * - Token validation checking
 *
 * Use Cases:
 * - User logout (invalidate JWT)
 * - Token revocation
 * - Security incident response
 *
 * @module routes/blacklist
 */

import { Prisma } from '@prisma/client';

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { blacklistSchema } from '../../schemas/blacklist';

/**
 * Token Blacklist Routes Plugin
 *
 * Registers routes for managing blacklisted authentication tokens.
 * Uses Zod schema validation for request validation.
 *
 * @param server - Fastify server instance
 */
const blacklistRoutes = async (server: FastifyInstance) => {
  /**
   * Add Token to Blacklist Endpoint
   *
   * Adds a token to the blacklist (typically during logout).
   * Prevents duplicate entries with database unique constraint.
   */
  server.post('/', {
    schema: {
      summary: 'Blacklist a token',
      description: 'Add a token to the blacklist (e.g., during logout)',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'JWT or session token to blacklist' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
        400: {
          description: 'Invalid request',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        409: {
          description: 'Token already blacklisted',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        500: { $ref: 'InternalError' },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      // Validate request body with Zod schema
      const parsedReq = blacklistSchema.safeParse(request.body);

      if (!parsedReq.success) {
        return reply.status(400).send({ error: 'Token required' });
      }

      const token = parsedReq.data.token;

      try {
        // Add token to blacklist using Prisma client from server instance
        await server.prisma.blackList.create({
          data: {
            token,
          },
        });

        server.log.info({ tokenHash: token.substring(0, 10) + '...' }, 'Token blacklisted');

        return reply.code(200).send({ success: true });
      } catch (error: unknown) {
        // Handle duplicate token error
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          server.log.warn(
            { tokenHash: token.substring(0, 10) + '...' },
            'Token already blacklisted',
          );

          return reply.status(409).send({ error: 'Token already blacklisted' });
        }

        // Handle other database errors
        server.log.error({ error }, 'Failed to blacklist token');

        return reply.status(500).send({
          error: 'Failed to blacklist token',
        });
      }
    },
  });

  /**
   * Check Token Blacklist Status Endpoint
   *
   * Checks if a token is blacklisted.
   * Used by authentication middleware to validate tokens.
   */
  server.get('/', {
    schema: {
      summary: 'Check if token is blacklisted',
      description: 'Query to check if a token exists in the blacklist',
      tags: ['auth'],
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'Token to check' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            blacklisted: { type: 'boolean' },
          },
        },
        400: {
          description: 'Invalid request',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        500: { $ref: 'InternalError' },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      // Validate query parameters with Zod schema
      const parsedReq = blacklistSchema.safeParse(request.query);

      if (!parsedReq.success) {
        return reply.status(400).send({ error: 'Token required' });
      }

      const token = parsedReq.data.token;

      try {
        // Check if token exists in blacklist
        const entry = await server.prisma.blackList.findUnique({
          where: { token },
        });

        return reply.code(200).send({ blacklisted: Boolean(entry) });
      } catch (error) {
        server.log.error({ error }, 'Failed to check token blacklist status');

        return reply.status(500).send({
          error: 'Failed to check blacklist status',
        });
      }
    },
  });
};

export default blacklistRoutes;

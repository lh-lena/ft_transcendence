/**
 * Error Handler Plugin
 *
 * Transforms service errors into proper HTTP status codes.
 * Catches all errors and provides consistent error responses.
 *
 * @module plugins/errorHandler
 */

import fp from 'fastify-plugin';
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyError,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { Prisma } from '@prisma/client';
import { NotFoundError, ConflictError, BlockedError, ValidationError } from '../utils/error';

const errorHandlerPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    server.log.error(
      {
        error,
        url: request.url,
        method: request.method,
        params: request.params,
        query: request.query,
      },
      'Request error occurred',
    );

    if (error instanceof NotFoundError) {
      return reply.code(404).send({
        error: 'Not Found',
        message: error.message,
      });
    }

    if (error instanceof ConflictError) {
      return reply.code(409).send({
        error: 'Conflict',
        message: error.message,
      });
    }

    if (error instanceof BlockedError) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: error.message,
      });
    }

    if (error instanceof ValidationError) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message,
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return reply.code(409).send({
            error: 'Conflict',
            message: 'Resource already exists',
          });

        case 'P2025':
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Resource not found',
          });

        case 'P2003':
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Invalid reference to related resource',
          });

        case 'P2014':
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'The change violates a relation constraint',
          });

        default:
          server.log.error({ error, code: error.code }, 'Unhandled Prisma error');
          return reply.code(500).send({
            error: 'Internal Server Error',
            message: 'Database operation failed',
          });
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid data provided',
      });
    }

    if (error.validation) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.validation,
      });
    }

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.name || 'Error',
        message: error.message,
      });
    }

    const isDev = server.config.NODE_ENV === 'development';

    return reply.code(500).send({
      error: 'Internal Server Error',
      message: isDev ? error.message : 'An unexpected error occurred',
      ...(isDev && { stack: error.stack }),
    });
  });

  server.log.info('Error handler registered');
};

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
  fastify: '5.x',
  dependencies: ['config'],
});

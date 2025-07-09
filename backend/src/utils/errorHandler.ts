import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError, NotFoundError, ValidationError, ConflictError, DatabaseError } from './error';

import { ZodError } from 'zod';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: error.code,
      message: error.message,
      //details: (error as any).details ?? undefined,
    });
  }

  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
      //details: error.errors,
    });
  }

  if ((error as any).validation) {
    return reply.code(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      //details: (error as any).validation,
    });
  }

  if ((error as any).statusCode === 404 && !(error as any).validation) {
    return reply.code(404).send({
      error: 'NOT_FOUND',
      message: error.message || 'Route not found',
    });
  }

  console.log(error); 

  return reply.code(500).send({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
  });
}

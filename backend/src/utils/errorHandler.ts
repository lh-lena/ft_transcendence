import { FastifyError, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import {
  AppError,
  //NotFoundError,
  //ValidationError,
  //ConflictError,
  //DatabaseError,
} from './error';

function hasValidationError(error: unknown): error is { validation: unknown } {
  return typeof error === 'object' && error !== null && 'validation' in error;
}

export function errorHandler(error: FastifyError | Error, reply: FastifyReply) {
  console.log(`Error occurred: ${error.message}`);

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: error.code,
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
    });
  }

  if (hasValidationError(error)) {
    return reply.code(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
    });
  }

  if (
    'statusCode' in error &&
    error.statusCode === 404 &&
    !('validation' in error)
  ) {
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

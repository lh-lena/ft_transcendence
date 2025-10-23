/**
 * Custom Error Classes
 *
 * Provides type-safe error classes for different error scenarios.
 * All errors extend Error for consistent error handling.
 *
 * Usage:
 * throw new NotFoundError('User not found');
 * throw new ValidationError('Invalid email format');
 *
 * @module utils/error
 */

/**
 * Not Found Error (404)
 *
 * Used when requested resource doesn't exist.
 *
 * @example
 * throw new NotFoundError('User not found');
 * throw new NotFoundError(`Game ${gameId} not found`);
 */
export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 *
 * Used when input validation fails.
 *
 * @example
 * throw new ValidationError('Invalid email format');
 * throw new ValidationError('Missing required field: name');
 */
export class ValidationError extends Error {
  constructor(message: string = 'Invalid input provided') {
    super(message);
    this.name = 'ValidationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Conflict Error (409)
 *
 * Used when operation conflicts with current state.
 *
 * @example
 * throw new ConflictError('User already exists');
 * throw new ConflictError('Email already registered');
 */
export class ConflictError extends Error {
  constructor(message: string = 'Resource already exists') {
    super(message);
    this.name = 'ConflictError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Blocked Error (403)
 *
 * Used when user is blocked from performing action.
 *
 * @example
 * throw new BlockedError('You are blocked by this user');
 * throw new BlockedError('Cannot send message: sender is blocked');
 */
export class BlockedError extends Error {
  constructor(message: string = 'User blocked you') {
    super(message);
    this.name = 'BlockedError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Unauthorized Error (401)
 *
 * Used when authentication is required or invalid.
 *
 * @example
 * throw new UnauthorizedError('Invalid credentials');
 * throw new UnauthorizedError('Token expired');
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 *
 * Used for general bad request scenarios.
 *
 * @example
 * throw new BadRequestError('Invalid request format');
 */
export class BadRequestError extends Error {
  constructor(message: string = 'Bad Request') {
    super(message);
    this.name = 'BadRequestError';
    Error.captureStackTrace(this, this.constructor);
  }
}

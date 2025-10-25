/**
 * Error Handler Plugin
 *
 * Unified error handler for the auth microservice that handles:
 * - Errors proxied from backend microservice
 * - Errors thrown within the auth service
 * - Validation errors from Fastify
 * - Custom application errors
 *
 * Features:
 * - Consistent error response format
 * - Request correlation via requestId
 * - Security-aware error messages (prod vs dev)
 * - Structured logging
 * - HTTP status code extraction from various error formats
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

/**
 * Standard error response format
 */
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  requestId: string;
  data?: unknown;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

/**
 * Extended error interface for backend proxy errors
 */
interface ProxiedError extends FastifyError {
  status?: number;
  response?: {
    status?: number;
    statusCode?: number;
    data?: {
      error?: string;
      message?: string;
      data?: unknown;
      details?: unknown;
    };
  };
  data?: unknown;
}

/**
 * Extracts HTTP status code from various error formats
 */
function extractStatusCode(error: ProxiedError): number {
  if (typeof error.statusCode === 'number') {
    return error.statusCode;
  }

  if (typeof error.status === 'number') {
    return error.status;
  }

  if (error.response) {
    if (typeof error.response.status === 'number') {
      return error.response.status;
    }
    if (typeof error.response.statusCode === 'number') {
      return error.response.statusCode;
    }
  }

  return 500;
}

/**
 * Extracts error name/type from various error formats
 */
function extractErrorName(error: ProxiedError, statusCode: number): string {
  if (error.name && error.name !== 'Error' && error.name !== 'FastifyError') {
    return error.name;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  const statusCodeMap: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };

  return statusCodeMap[statusCode] || 'Error';
}

/**
 * Extracts error message with security considerations
 */
function extractErrorMessage(
  error: ProxiedError,
  statusCode: number,
  isProduction: boolean,
): string {
  if (isProduction && statusCode === 500) {
    return 'Unexpected Error. Retry.';
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'An error occurred';
}

/**
 * Extracts additional error data/details
 */
function extractErrorData(error: ProxiedError): {
  data?: unknown;
  details?: unknown;
} {
  const result: { data?: unknown; details?: unknown } = {};

  if (error.response?.data?.data) {
    result.data = error.response.data.data;
  } else if (error.data) {
    result.data = error.data;
  }

  if (error.validation) {
    result.details = error.validation;
  } else if (error.response?.data?.details) {
    result.details = error.response.data.details;
  }

  return result;
}

/**
 * Determines if detailed error information should be included
 */
function shouldIncludeDebugInfo(statusCode: number, isProduction: boolean): boolean {
  if (!isProduction) {
    return true;
  }

  return statusCode >= 400 && statusCode < 500;
}

const errorHandlerPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  const isProduction = server.config.NODE_ENV === 'production';

  server.setErrorHandler((error: ProxiedError, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = extractStatusCode(error);

    server.log.error(
      {
        error: {
          name: error.name,
          message: error.message,
          statusCode,
          code: error.code,
          validation: error.validation,
          ...(error.response && {
            proxied: {
              status: error.response.status || error.response.statusCode,
              data: error.response.data,
            },
          }),
        },
        request: {
          id: request.id,
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
          ...(!isProduction && { body: request.body }),
        },
      },
      'Request error occurred',
    );

    const errorName = extractErrorName(error, statusCode);
    const errorMessage = extractErrorMessage(error, statusCode, isProduction);
    const { data, details } = extractErrorData(error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: errorName,
      message: errorMessage,
      requestId: request.id,
    };

    if (shouldIncludeDebugInfo(statusCode, isProduction)) {
      if (data !== undefined && data !== null) {
        errorResponse.data = data;
      }
      if (details !== undefined && details !== null) {
        errorResponse.details = details;
      }
    }

    if (!isProduction) {
      errorResponse.timestamp = new Date().toISOString();
      errorResponse.path = request.url;
    }

    return reply.status(statusCode).send(errorResponse);
  });

  server.log.info('Error handler registered');
};

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
  fastify: '5.x',
  dependencies: ['config'],
});

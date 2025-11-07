import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AxiosRequestConfig } from 'axios';
import { z } from 'zod';

/**
 * Generic Route Handler Configuration
 *
 * Provides a standardized way to define API routes with:
 * - Automatic request validation (params, body, query)
 * - Response validation
 * - Ownership checks (authorization)
 * - Request/response transformation
 * - Custom handler support
 *
 * This reduces boilerplate and ensures consistent error handling across routes.
 */

/**
 * Route Configuration Interface
 *
 * @template TParams - Zod schema for route parameters (e.g., /user/:id)
 * @template TBody - Zod schema for request body
 * @template TQuery - Zod schema for query string parameters
 * @template TResponse - Zod schema for response data
 */
interface RouteConfig<
  TParams extends z.ZodSchema = z.ZodSchema,
  TBody extends z.ZodSchema = z.ZodSchema,
  TQuery extends z.ZodSchema = z.ZodSchema,
  TResponse extends z.ZodSchema = z.ZodSchema,
> {
  /** HTTP method for backend API call */
  method: 'get' | 'post' | 'patch' | 'delete';

  /**
   * Backend API endpoint URL
   * Can be static string or function that generates URL from params
   * @example '/user' or ((params) => `/user/${params.id}`)
   */
  url?: string | ((params: z.infer<TParams>) => string);

  /** Zod schema for validating route parameters (/user/:id) */
  paramsSchema?: TParams;

  /** Zod schema for validating request body */
  bodySchema?: TBody;

  /** Zod schema for validating query parameters (?page=1&limit=10) */
  querySchema?: TQuery;

  /** Zod schema for validating response data from backend */
  responseSchema?: TResponse;

  /**
   * Dynamic response schema selection
   * Useful when response structure varies based on request data or user
   * @example Select different schema based on user role
   */
  selectResponseSchema?: (
    response: unknown,
    data: {
      params?: z.infer<TParams>;
      body?: z.infer<TBody>;
      query?: z.infer<TQuery>;
    },
    userId: string,
  ) => z.ZodSchema;

  /**
   * Authorization check
   * Returns true if user is allowed to perform this action
   * @example Check if user owns the resource they're trying to modify
   */
  checkOwnership?: (
    data: {
      params?: z.infer<TParams>;
      body?: z.infer<TBody>;
      query?: z.infer<TQuery>;
    },
    userId: string,
    server: FastifyInstance,
  ) => Promise<boolean> | boolean;

  /**
   * Transform request data before sending to backend
   * @example Add userId to request body, hash passwords, etc.
   */
  transformRequest?: (
    data: z.infer<TBody>,
    server: FastifyInstance,
    req: FastifyRequest,
  ) => Promise<unknown> | unknown;

  /**
   * Transform response data before sending to client
   * @example Remove sensitive fields, format dates, etc.
   */
  transformResponse?: (data: unknown, req: FastifyRequest) => unknown;

  /**
   * Custom handler for routes that don't follow standard pattern
   * If provided, skips normal request flow and uses this instead
   */
  customHandler?: (
    req: FastifyRequest,
    reply: FastifyReply,
    server: FastifyInstance,
    parsedData: {
      params?: z.infer<TParams>;
      body?: z.infer<TBody>;
      query?: z.infer<TQuery>;
    },
  ) => Promise<void>;

  /** Skip backend API call (useful for routes that only validate/transform) */
  skipApiCall?: boolean;

  /** HTTP status code for successful responses (default: 200) */
  successCode?: number;

  /** Custom error messages for different validation failures */
  errorMessages?: {
    invalidParams?: string;
    invalidBody?: string;
    invalidQuery?: string;
    forbidden?: string;
    parseError?: string;
    apiError?: string;
  };
}

/**
 * Generic route handler with built-in validation and error handling
 *
 * Handles the complete request lifecycle:
 * 1. Validate request (params, body, query)
 * 2. Check authorization (if checkOwnership provided)
 * 3. Transform request (if transformRequest provided)
 * 4. Call backend API (unless skipApiCall or customHandler)
 * 5. Transform response (if transformResponse provided)
 * 6. Validate response (if responseSchema provided)
 * 7. Send response
 *
 * @template TParams - Route parameters schema type
 * @template TBody - Request body schema type
 * @template TQuery - Query parameters schema type
 * @template TResponse - Response schema type
 *
 * @param req - Fastify request object
 * @param reply - Fastify reply object
 * @param config - Route configuration
 * @param server - Fastify server instance
 * @returns Promise<void> - Sends response directly via reply object
 *
 * @example
 * // Simple GET route
 * fastify.get('/user/:id', async (req, reply) => {
 *   return routeHandler(req, reply, {
 *     method: 'get',
 *     url: (params) => `/user/${params.id}`,
 *     paramsSchema: z.object({ id: z.string().uuid() }),
 *     responseSchema: UserSchema,
 *   }, fastify);
 * });
 *
 * @example
 * // POST route with ownership check
 * fastify.post('/user/:id/profile', async (req, reply) => {
 *   return routeHandler(req, reply, {
 *     method: 'post',
 *     url: (params) => `/user/${params.id}/profile`,
 *     paramsSchema: z.object({ id: z.string().uuid() }),
 *     bodySchema: ProfileUpdateSchema,
 *     checkOwnership: (data, userId) => data.params.id === userId,
 *     successCode: 201,
 *   }, fastify);
 * });
 */
export async function routeHandler<
  TParams extends z.ZodSchema = z.ZodSchema,
  TBody extends z.ZodSchema = z.ZodSchema,
  TQuery extends z.ZodSchema = z.ZodSchema,
  TResponse extends z.ZodSchema = z.ZodSchema,
>(
  req: FastifyRequest,
  reply: FastifyReply,
  config: RouteConfig<TParams, TBody, TQuery, TResponse>,
  server: FastifyInstance,
): Promise<void> {
  const messages = config.errorMessages || {};

  // Track request for logging
  const requestId = req.id || 'unknown';

  try {
    // ========================================
    // STEP 1: Validate Request Parameters
    // ========================================

    let parsedParams: z.infer<TParams> | undefined;
    if (config.paramsSchema) {
      const result = config.paramsSchema.safeParse(req.params);
      if (!result.success) {
        server.log.warn(
          {
            requestId,
            url: req.url,
            errors: result.error.issues,
          },
          'Invalid route parameters',
        );

        return reply.status(400).send({
          message: messages.invalidParams || 'Invalid parameters',
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      parsedParams = result.data;
    }

    // ========================================
    // STEP 2: Validate Request Body
    // ========================================

    let parsedBody: z.infer<TBody> | undefined;
    if (config.bodySchema) {
      const result = config.bodySchema.safeParse(req.body);
      if (!result.success) {
        server.log.warn(
          {
            requestId,
            url: req.url,
            errors: result.error.issues,
          },
          'Invalid request body',
        );

        return reply.status(400).send({
          message: messages.invalidBody || 'Invalid request body',
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      parsedBody = result.data;
    }

    // ========================================
    // STEP 3: Validate Query Parameters
    // ========================================

    let parsedQuery: z.infer<TQuery> | undefined;
    if (config.querySchema) {
      const result = config.querySchema.safeParse(req.query);
      if (!result.success) {
        server.log.warn(
          {
            requestId,
            url: req.url,
            errors: result.error.issues,
          },
          'Invalid query parameters',
        );

        return reply.status(400).send({
          message: messages.invalidQuery || 'Invalid query parameters',
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      parsedQuery = result.data;
    }

    // ========================================
    // STEP 4: Check Authorization
    // ========================================

    if (config.checkOwnership) {
      // Get authenticated user ID
      const userId = req.user?.id;

      if (!userId) {
        server.log.warn({ requestId, url: req.url }, 'Ownership check failed: no user ID');
        return reply.status(401).send({
          message: 'AUTHENTICATION_FAILED',
        });
      }

      const isAuthorized = await config.checkOwnership(
        {
          params: parsedParams,
          body: parsedBody,
          query: parsedQuery,
        },
        userId,
        server,
      );

      if (!isAuthorized) {
        server.log.warn(
          {
            requestId,
            url: req.url,
            userId,
          },
          'Ownership check failed: unauthorized',
        );

        return reply.status(403).send({
          message: messages.forbidden || 'Forbidden',
        });
      }
    }

    // ========================================
    // STEP 5: Custom Handler (if provided)
    // ========================================

    if (config.customHandler) {
      server.log.debug({ requestId, url: req.url }, 'Using custom handler');
      return config.customHandler(req, reply, server, {
        params: parsedParams,
        body: parsedBody,
        query: parsedQuery,
      });
    }

    // ========================================
    // STEP 6: Prepare Backend API Call
    // ========================================

    // Generate URL from params if needed
    const url = typeof config.url === 'function' ? config.url(parsedParams!) : config.url;

    if (!url) {
      throw new Error('URL is required when not using customHandler');
    }

    // Transform request body if needed
    let requestData: unknown = parsedBody;
    if (config.transformRequest && parsedBody) {
      requestData = await config.transformRequest(parsedBody, server, req);
    }

    // Build axios config
    const axiosConfig: AxiosRequestConfig = {
      method: config.method,
      url,
    };

    if (requestData) axiosConfig.data = requestData;
    if (parsedQuery) axiosConfig.params = parsedQuery;

    // ========================================
    // STEP 7: Call Backend API
    // ========================================

    let response: unknown;
    if (!config.skipApiCall) {
      try {
        server.log.debug(
          {
            requestId,
            method: config.method.toUpperCase(),
            url,
          },
          'Calling backend API',
        );

        response = await server.api(axiosConfig);
      } catch (error) {
        server.log.error(
          {
            requestId,
            method: config.method.toUpperCase(),
            url,
            error,
          },
          'Backend API call failed',
        );

        // Return generic error to client (don't expose internal details)
        return reply.status(502).send({
          message: messages.apiError || 'Backend service error',
          requestId,
        });
      }
    }

    // ========================================
    // STEP 8: Transform Response
    // ========================================

    let finalResponse: unknown = response;
    if (config.transformResponse) {
      finalResponse = config.transformResponse(response, req);
    }

    // ========================================
    // STEP 9: Validate Response
    // ========================================

    // Select schema dynamically if needed
    let schemaToUse: z.ZodSchema | undefined;
    if (config.selectResponseSchema) {
      const userId = req.user?.id || 'anonymous';
      schemaToUse = config.selectResponseSchema(
        finalResponse,
        {
          params: parsedParams,
          body: parsedBody,
          query: parsedQuery,
        },
        userId,
      );
    } else {
      schemaToUse = config.responseSchema;
    }

    // Validate response against schema
    if (schemaToUse) {
      const result = schemaToUse.safeParse(finalResponse);
      if (!result.success) {
        server.log.error(
          {
            requestId,
            url: req.url,
            errors: result.error.issues,
          },
          'Response validation failed',
        );

        return reply.status(500).send({
          message: messages.parseError || 'Failed to parse response data',
          requestId,
        });
      }
      finalResponse = result.data;
    }

    // ========================================
    // STEP 10: Send Response
    // ========================================

    server.log.debug(
      {
        requestId,
        statusCode: config.successCode || 200,
      },
      'Request completed successfully',
    );

    return reply.status(config.successCode || 200).send(finalResponse);
  } catch (error) {
    // Catch any unexpected errors
    server.log.error(
      {
        requestId,
        url: req.url,
        error,
      },
      'Unexpected error in route handler',
    );

    return reply.status(500).send({
      message: 'Internal server error',
      requestId,
    });
  }
}

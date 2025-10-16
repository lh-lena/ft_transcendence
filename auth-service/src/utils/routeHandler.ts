import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AxiosRequestConfig } from 'axios';
import { z } from 'zod';

interface RouteConfig<
  TParams extends z.ZodSchema = z.ZodSchema,
  TBody extends z.ZodSchema = z.ZodSchema,
  TQuery extends z.ZodSchema = z.ZodSchema,
  TResponse extends z.ZodSchema = z.ZodSchema,
> {
  method: 'get' | 'post' | 'patch' | 'delete';
  url?: string | ((params: z.infer<TParams>) => string);
  paramsSchema?: TParams;
  bodySchema?: TBody;
  querySchema?: TQuery;
  responseSchema?: TResponse;
  selectResponseSchema?: (
    response: unknown,
    data: {
      params?: z.infer<TParams>;
      body?: z.infer<TBody>;
      query?: z.infer<TQuery>;
    },
    userId: string,
  ) => z.ZodSchema;
  checkOwnership?: (
    data: {
      params?: z.infer<TParams>;
      body?: z.infer<TBody>;
      query?: z.infer<TQuery>;
    },
    userId: string,
    server: FastifyInstance,
  ) => Promise<boolean> | boolean;
  transformRequest?: (
    data: z.infer<TBody>,
    server: FastifyInstance,
    req: FastifyRequest,
  ) => Promise<unknown> | unknown;
  transformResponse?: (data: unknown, req: FastifyRequest) => unknown;
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
  skipApiCall?: boolean;
  successCode?: number;
  errorMessages?: {
    invalidParams?: string;
    invalidBody?: string;
    invalidQuery?: string;
    forbidden?: string;
    parseError?: string;
  };
}

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
) {
  const messages = config.errorMessages || {};

  let parsedParams: z.infer<TParams> | undefined;
  if (config.paramsSchema) {
    const result = config.paramsSchema.safeParse(req.params);
    if (!result.success) {
      return reply.status(400).send({
        message: messages.invalidParams || 'Invalid parameters',
      });
    }
    parsedParams = result.data;
  }

  let parsedBody: z.infer<TBody> | undefined;
  if (config.bodySchema) {
    const result = config.bodySchema.safeParse(req.body);
    if (!result.success) {
      return reply.status(400).send({
        message: messages.invalidBody || 'Invalid request body',
      });
    }
    parsedBody = result.data;
  }

  let parsedQuery: z.infer<TQuery> | undefined;
  if (config.querySchema) {
    const result = config.querySchema.safeParse(req.query);
    if (!result.success) {
      return reply.status(400).send({
        message: messages.invalidQuery || 'Invalid query parameters',
      });
    }
    parsedQuery = result.data;
  }

  if (config.checkOwnership) {
    const isAuthorized = await config.checkOwnership(
      {
        params: parsedParams,
        body: parsedBody,
        query: parsedQuery,
      },
      req.user?.id,
      server,
    );

    if (!isAuthorized) {
      return reply.code(403).send({
        message: messages.forbidden || 'Forbidden',
      });
    }
  }

  if (config.customHandler) {
    return config.customHandler(req, reply, server, {
      params: parsedParams,
      body: parsedBody,
      query: parsedQuery,
    });
  }

  const url = typeof config.url === 'function' ? config.url(parsedParams!) : config.url;

  if (!url) {
    throw new Error('URL is required when not using customHandler');
  }

  let requestData: unknown = parsedBody;
  if (config.transformRequest && parsedBody) {
    requestData = await config.transformRequest(parsedBody, server, req);
  }

  const axiosConfig: AxiosRequestConfig = {
    method: config.method,
    url,
  };

  if (requestData) axiosConfig.data = requestData;
  if (parsedQuery) axiosConfig.params = parsedQuery;

  let response: unknown;
  if (!config.skipApiCall) {
    response = await server.api(axiosConfig);
  }

  let finalResponse: unknown = response;
  if (config.transformResponse) {
    finalResponse = config.transformResponse(response, req);
  }

  let schemaToUse;

  if (config.selectResponseSchema) {
    schemaToUse = config.selectResponseSchema(
      finalResponse,
      {
        params: parsedParams,
        body: parsedBody,
        query: parsedQuery,
      },
      req.user?.id,
    );
  } else {
    schemaToUse = config.responseSchema;
  }

  if (schemaToUse) {
    const result = schemaToUse.safeParse(finalResponse);
    if (!result.success) {
      return reply.code(500).send({
        message: messages.parseError || 'Failed to parse response data',
      });
    }
    finalResponse = result.data;
  }

  return reply.code(config.successCode || 200).send(finalResponse);
}

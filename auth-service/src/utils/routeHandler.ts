import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AxiosRequestConfig } from 'axios';
import { z } from 'zod';

interface RouteConfig {
  method: 'get' | 'post' | 'patch' | 'delete';
  url: string | ((params: any) => string);
  paramsSchema?: z.ZodSchema;
  bodySchema?: z.ZodSchema;
  querySchema?: z.ZodSchema;
  responseSchema?: z.ZodSchema;
  checkOwnership?: (parsedData: any, userId: string) => boolean;
  transformRequest?: (data: any, server?: FastifyInstance) => Promise<any> | any;
  transformResponse?: (data: any, req: FastifyRequest) => any;
  successCode?: number;
  errorMessages?: {
    invalidParams?: string;
    invalidBody?: string;
    invalidQuery?: string;
    forbidden?: string;
    parseError?: string;
  };
}

export async function handleRoute(
  req: FastifyRequest,
  reply: FastifyReply,
  config: RouteConfig,
  server: FastifyInstance,
) {
  const messages = config.errorMessages || {};

  // Validate params
  let parsedParams;
  if (config.paramsSchema) {
    const result = config.paramsSchema.safeParse(req.params);
    if (!result.success) {
      return reply.status(400).send({
        message: messages.invalidParams || 'Invalid parameters',
      });
    }
    parsedParams = result.data;
  }

  // Validate body
  let parsedBody;
  if (config.bodySchema) {
    const result = config.bodySchema.safeParse(req.body);
    if (!result.success) {
      return reply.status(400).send({
        message: messages.invalidBody || 'Invalid request body',
      });
    }
    parsedBody = result.data;
  }

  // Validate query
  let parsedQuery;
  if (config.querySchema) {
    const result = config.querySchema.safeParse(req.query);
    if (!result.success) {
      return reply.status(400).send({
        message: messages.invalidQuery || 'Invalid query parameters',
      });
    }
    parsedQuery = result.data;
  }

  // Check ownership
  if (config.checkOwnership) {
    const dataToCheck = parsedBody || parsedParams || parsedQuery;
    if (!config.checkOwnership(dataToCheck, req.user?.id)) {
      return reply.code(403).send({
        message: messages.forbidden || 'Forbidden',
      });
    }
  }

  // Build URL
  const url = typeof config.url === 'function' ? config.url(parsedParams || {}) : config.url;

  // Transform request data
  let requestData = parsedBody;
  if (config.transformRequest && parsedBody) {
    requestData = await config.transformRequest(parsedBody, server);
  }

  // Prepare axios config
  const axiosConfig: AxiosRequestConfig = {
    method: config.method,
    url,
    headers: req.headers,
  };

  if (requestData) axiosConfig.data = requestData;
  if (parsedQuery) axiosConfig.params = parsedQuery;

  // Make API call
  const response = await server.api(axiosConfig);

  // Transform response
  let finalResponse = response;
  if (config.transformResponse) {
    finalResponse = config.transformResponse(response, req);
  }

  // Validate response
  if (config.responseSchema) {
    const result = config.responseSchema.safeParse(finalResponse);
    if (!result.success) {
      return reply.code(500).send({
        message: messages.parseError || 'Failed to parse response data',
      });
    }
    finalResponse = result.data;
  }

  return reply.code(config.successCode || 200).send(finalResponse);
}

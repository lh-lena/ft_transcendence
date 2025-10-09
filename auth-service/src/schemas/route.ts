// types/routes.ts
import { FastifyRequest } from 'fastify';
import { z } from 'zod';

export interface AuthenticatedUser {
  id: string;
  role?: string;
}

export interface TypedFastifyRequest<TParams = unknown, TQuery = unknown, TBody = unknown>
  extends FastifyRequest {
  params: TParams;
  query: TQuery;
  body: TBody;
}

export type AuthLevel = 'required' | 'owner' | 'participant' | 'none';

export interface RouteTransforms<TRequest = unknown, TResponse = unknown, TParams = unknown> {
  request?: (data: TRequest, user: AuthenticatedUser) => Promise<TRequest> | TRequest;
  response?: (data: TResponse, user: AuthenticatedUser, params: TParams) => TResponse;
}

export interface RouteConfig<
  TParams = Record<string, string>,
  TQuery = Record<string, string>,
  TBody = Record<string, unknown>,
  TResponse = unknown,
> {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  backendPath?: string;
  auth: AuthLevel;
  ownerCheck?: (params: TParams & TQuery & TBody, user: AuthenticatedUser) => boolean;
  participantCheck?: (
    params: TParams & TQuery & TBody,
    user: AuthenticatedUser,
  ) => Promise<boolean>;
  requestSchema?: z.infer<TBody>;
  responseSchema?: z.infer<TResponse>;
  paramsSchema?: z.infer<TParams>;
  querySchema?: z.infer<TQuery>;
  transform?: RouteTransforms<TBody, TResponse, TParams>;
}

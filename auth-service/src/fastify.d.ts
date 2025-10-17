import 'fastify';
import { OAuth2Namespace } from '@fastify/oauth2';
import { tfaHandler } from './utils/tfa';
import { userActions } from './utils/userActions';
import { apiClientBackend } from './utils/apiClient';
import { routeHandler } from './utils/routeHandler';
import { FastifyJwTNamespace } from './schemas/jwt';

interface AuthData {
  jwt: string;
  refreshToken: string;
  userId: string;
  role: string;
}

interface AuthCookies {
  id: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    config;
    metrics;
    jwt: {
      access: FastifyJwTNamespace;
      refresh: FastifyJwTNamespace;
    };
    githubOAuth2: OAuth2Namespace;
    api: apiClientBackend;
    routeHandler: routeHandler;
    tfa: tfaHandler;
    user: userActions;
    updateServiceHealth;
    cleanupExpiredSession(): Promise<void>;
    generateAccessToken(payload: object): string;
    generateRefreshToken(payload: object): string;
    verifyAccessToken(token: string): JwTReturnType;
    verifyRefreshToken(token: string): JwTReturnType;
  }
  interface FastifyRequest {
    user: {
      id: string;
      role: string;
      iat: number;
      exp: number;
    };
    startTime: number;
  }
  interface FastifyReply {
    setAuthCookies(data: AuthCookies): FastifyReply;
    doSending(options?: SendOptions): FastifyReply;
    authData?: AuthData;
  }
}

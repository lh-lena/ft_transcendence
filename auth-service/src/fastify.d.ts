import 'fastify';
import { OAuth2Namespace } from '@fastify/oauth2';
import { tfaHandler } from './utils/tfa';
import { apiClientBackend } from './utils/apiClient';
import { userActions } from './utils/userActions';
import { FastifyJwTNamespace } from './schemas/jwt';

interface AuthData {
  jwt: string;
  userId: string;
  refreshToken: string;
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
      iat: number;
      exp: number;
      role?: string;
    };
    startTime: number;
  }
  interface FastifyReply {
    setAuthCookies(userId: string): FastifyReply;
    doSending(options?: SendOptions): FastifyReply;
    authData?: AuthData;
  }
}

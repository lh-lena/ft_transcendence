import 'fastify';
import { OAuth2Namespace } from '@fastify/oauth2';
import { tfaHandler } from './utils/tfa';
import { apiClientBackend } from './utils/apiClient';
import { userActions } from './utils/userActions';
import { CookieOptions } from './schemas/cookie';
import { FastifyJwTNamespace } from './schemas/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    config;
    jwt: {
      access: FastifyJwTNamespace;
      refresh: FastifyJwTNamespace;
    };
    githubOAuth2: OAuth2Namespace;
    api: apiClientBackend;
    tfa: tfaHandler;
    user: userActions;
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
    };
  }
  interface FastifyReply {
    setAuthCookie(name: string, value: string, options?: CookieOptions): FastifyReply;
  }
}

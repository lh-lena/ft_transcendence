import 'fastify';
import { OAuth2Namespace } from '@fastify/oauth2';
import { tfaHandler } from './utils/tfa';
import { apiClientBackend } from './utils/apiClient';
import { userActions } from './utils/userActions';

interface FastifyJwtNamespace {
  sign: (payload: object) => string;
  verify: (token: string) => object;
}

declare module 'fastify' {
  interface FastifyInstance {
    config;
    jwt: {
      access: FastifyJwtNamespace;
      refresh: FastifyJwtNamespace;
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
}

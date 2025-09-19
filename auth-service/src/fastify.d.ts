import 'fastify';
//import { JwTPayloadType } from './schemas/jwt';

interface FastifyJwtNamespace {
  sign: (payload: object) => string;
  verify: (token: string) => object;
}

declare module 'fastify' {
  interface FastifyInstance {
    access: FastifyJwtNamespace;
    refresh: FastifyJwtNamespace;
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

import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    cleanupExpiredSession(): Promise<void>;
    generateAccessToken(payload: object): string;
    generateRefreshToken(payload: object): string;
    verifyAccessToken(token: string): object;
    verifyRefreshToken(token: string): object;
  }
  interface FastifyRequest {
    user: {
      id: string;
      iat: number;
      exp: number;
    };
  }
}

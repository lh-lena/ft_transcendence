import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    generateAccessToken(payload: object): string;
    generateRefreshToken(payload: object): string;
  }
}

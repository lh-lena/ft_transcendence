import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      sub: number;
      username: string;
      email: string;
      alias?: string;
      is_2fa_enabled: boolean;
      iat?: number;
      exp?: number;
    };
  }
}

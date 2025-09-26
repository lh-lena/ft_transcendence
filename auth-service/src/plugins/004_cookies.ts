import fp from 'fastify-plugin';
import { FastifyInstance, FastifyReply } from 'fastify';

import fastifyCookie from '@fastify/cookie';
import { CookieOptions } from '../schemas/cookie';

const cookiePlugin = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyCookie);

  fastify.decorateReply(
    'setAuthCookie',
    function (this: FastifyReply, name: string, value: string, options?: CookieOptions) {
      const deafultOptions: CookieOptions = {
        httpOnly: true,
        secure: false, //TODO set to true in production
        sameSite: 'strict',
        path: '/',
      };
      const opts = { ...deafultOptions, ...options };
      return this.setCookie(name, value, opts);
    },
  );
};

export default fp(cookiePlugin);

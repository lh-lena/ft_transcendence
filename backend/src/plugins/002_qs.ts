import fp from 'fastify-plugin';
import qs from 'qs';
import { FastifyInstance } from 'fastify';

const qsPlugin = async (server: FastifyInstance) => {
  server.addHook('onRequest', async (request) => {
    const url = request.raw.url ?? '';
    const queryString = url.split('?')[1];
    if (queryString) {
      const parsed = qs.parse(queryString, {
        allowDots: true,
      });

      if (parsed.gamePlayed) {
        parsed.gamePlayed = { some: parsed.gamePlayed };
      }

      request.query = parsed;
    }
  });
};

export default fp(qsPlugin);

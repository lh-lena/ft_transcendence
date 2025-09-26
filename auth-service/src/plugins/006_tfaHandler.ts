import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { tfaHandler } from '../utils/tfa.js';

const tfaHandlerPlugin = async (fastify: FastifyInstance) => {
  fastify.decorate('tfa', new tfaHandler(fastify));
};

export default fp(tfaHandlerPlugin);

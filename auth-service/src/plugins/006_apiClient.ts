import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { apiClientBackend } from '../utils/apiClient.js';

const tfaHandlerPlugin = async (fastify: FastifyInstance) => {
  fastify.decorate('api', apiClientBackend);
};

export default fp(tfaHandlerPlugin);

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { apiClientBackend } from '../utils/apiClient.js';

import type { AxiosRequestConfig } from 'axios';

const tfaHandlerPlugin = async (fastify: FastifyInstance) => {
  console.log('Axios creation', process.env.BACKEND_URL);
  fastify.decorate('api', apiClientBackend);
};

export default fp(tfaHandlerPlugin);

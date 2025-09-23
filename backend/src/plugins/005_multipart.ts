import fp from 'fastify-plugin';
import fastifyMultipart from '@fastify/multipart';
import { FastifyInstance } from 'fastify';

const multipartPlugin = async (server: FastifyInstance) => {
  server.register(fastifyMultipart);
};

export default fp(multipartPlugin);

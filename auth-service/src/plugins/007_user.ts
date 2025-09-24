import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { userActions } from '../utils/user';

const userActionsPlugin = async (fastify: FastifyInstance) => {
  fastify.decorate('user', userActions(fastify));
};

export default fp(userActionsPlugin);

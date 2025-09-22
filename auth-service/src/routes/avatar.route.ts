import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AxiosRequestConfig } from 'axios';
import { apiClientBackend } from '../utils/apiClient';

const avatarRoute = async (fastify: FastifyInstance) => {
  fastify.get('/api/avatar/', async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user.id as string;

    try {
      const config: AxiosRequestConfig = {
        method: 'get',
        url: `/avatar/${userId}`,
        responseType: 'stream',
      };

      const backendRes = await apiClientBackend(config);

      reply.headers({
        'Content-Type': backendRes.headers['content-type'],
      });

      backendRes.data.pipe(reply.raw);
    } catch (error) {
      reply.code(404).send({ message: 'Avatar not found' });
    }
  });
};

export default fp(avatarRoute);

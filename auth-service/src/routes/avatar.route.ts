import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AxiosRequestConfig } from 'axios';
import { apiClientBackend } from '../utils/apiClient';

const avatarRoute = async (fastify: FastifyInstance) => {
  fastify.get('/api/avatar/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = req.params as { userId: string };
      console.log(`Fetching avatar for userId: ${userId.userId}`);
      const config: AxiosRequestConfig = {
        method: 'get',
        url: `/avatar/${userId.userId}`,
        responseType: 'stream',
      };

      const backendRes = await apiClientBackend(config);
      console.log('Backend response status:', backendRes.status);
      console.log('Backend response headers:', backendRes.headers);

      // Check if we're getting an error page instead of an image
      if (backendRes.headers['content-type']?.includes('text/html')) {
        console.error('Backend returned HTML instead of image!');
        return reply.code(404).send({ message: 'Avatar not found' });
      }

      reply.type(backendRes.headers['content-type'] || 'image/png');
      return reply.send(backendRes.buffer);
    } catch (error) {
      console.log('Error fetching avatar:', error);
      reply.code(404).send({ message: 'Avatar not found' });
    }
  });
};

export default fp(avatarRoute);

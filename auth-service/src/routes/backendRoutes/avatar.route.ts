/**
 * Avatar Proxy Routes
 *
 * Proxies avatar image requests to the backend file storage service
 * Acts as authentication layer and provides consistent error handling
 *
 * Benefits of proxying:
 * - Single point of authentication
 * - Consistent error responses
 * - Can add caching headers
 * - Hides backend infrastructure details
 *
 * @module routes/avatarRoute
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AxiosRequestConfig } from 'axios';

const avatarRoute = async (fastify: FastifyInstance) => {
  /**
   * GET /api/avatar/:userId
   * Retrieves user avatar image
   *
   * Proxies request to backend storage service
   * Returns default avatar if user has no custom avatar
   *
   * @param userId - User ID to fetch avatar for
   * @returns Image file (PNG)
   * @returns 404 - Avatar not found
   *
   * @public - No authentication required (avatars are public)
   */
  fastify.get('/avatar/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = req.params as { userId: string };

    if (!userId || typeof userId !== 'string' || userId.includes('..') || userId.includes('/')) {
      fastify.log.warn({ userId }, 'Invalid userId in avatar request');
      return reply.code(400).send({ message: 'Invalid user ID' });
    }

    try {
      fastify.log.debug({ userId }, 'Fetching avatar from backend');

      const config: AxiosRequestConfig = {
        method: 'get',
        url: `/avatar/${userId}`,
        responseType: 'stream',
      };

      const backendRes = await fastify.api(config);

      const contentType = backendRes.headers['content-type'];

      if (!contentType?.startsWith('image/')) {
        fastify.log.warn({ userId, contentType }, 'Backend returned non-image content type');
        return reply.code(404).send({ message: 'Avatar not found' });
      }

      fastify.log.debug({ userId, contentType }, 'Avatar fetched successfully');

      return reply
        .type(contentType)
        .header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
        .header('ETag', `"${userId}-${Date.now()}"`) // Basic ETag for cache validation
        .send(backendRes.buffer);
    } catch (error) {
      fastify.log.error({ err: error, userId }, 'Failed to fetch avatar from backend');

      // Return appropriate error based on backend response
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        const status = axiosError.response?.status || 500;

        if (status === 404) {
          return reply.code(404).send({ message: 'Avatar not found' });
        }
      }

      return reply.code(500).send({ message: 'Failed to retrieve avatar' });
    }
  });
};

export default avatarRoute;

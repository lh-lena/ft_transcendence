import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';
import type { UserType } from '../schemas/user';
import { userIdSchema, userResponseSchema, userInfoResponseSchema } from '../schemas/user';

const backendRoutes = async (fastify: FastifyInstance) => {

  //-------User Routes-------//

  fastify.get('/user/:id', async (req: FastifyRequest, reply: FastifyReply) => {

    const user: UserType = await apiClientBackend.get(`/user/${(req.params as { id: string }).id}`);

    const requestId = userIdSchema.safeParse(req.params);
    const schema = req.params.id === req.user.id ? userResponseSchema : userInfoResponseSchema;

    const ret = schema.parse(user);

    return reply.code(200).send(ret);
  },

  };

export default fp(backendRoutes);

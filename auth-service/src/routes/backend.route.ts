import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { apiClientBackend } from '../utils/apiClient';
import type { UserType, UserIdType } from '../schemas/user';
import { userIdSchema, userResponseSchema, userInfoResponseSchema } from '../schemas/user';

const backendRoutes = async (fastify: FastifyInstance) => {
  //-------User Routes-------//

  fastify.get('/user/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = userIdSchema.safeParse(req.params);

    if (!parsedReq.success) {
      return reply.code(400).send({ error: 'Invalid user ID' });
    }

    const requestId: UserIdType = parsedReq.data;

    const user: UserType = await apiClientBackend.get(`/user/${requestId.userId}`);

    //@ts-expect-error is for test
    const isSelf = requestId.userId === req.user.id;
    const schema = isSelf ? userResponseSchema : userInfoResponseSchema;

    const ret = schema.parse(user);

    return reply.code(200).send(ret);
  });
};

export default fp(backendRoutes);

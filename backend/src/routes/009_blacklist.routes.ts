import fp from 'fastify-plugin';
import { prisma } from '../plugins/001_prisma';
import { Prisma } from '@prisma/client';

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { blacklistSchema } from '../schemas/blacklist';

const blacklistRoutes = async (server: FastifyInstance) => {
  server.post('/api/blacklist', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = blacklistSchema.safeParse(req.body);
    if (!parsedReq.success) return reply.status(400).send({ error: 'Token required' });

    const token = parsedReq.data.token;

    try {
      await prisma.blackList.create({
        data: {
          token,
        },
      });
      reply.send({ success: true });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        reply.status(409).send({ error: 'Token already blacklisted' });
      } else {
        reply.status(500).send({ error: 'DB error', details: err });
      }
    }
  });

  server.get('/blacklist/:token', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsedReq = blacklistSchema.safeParse(req.params);

    if (!parsedReq.success) return reply.status(400).send({ error: 'Token required' });

    const token = parsedReq.data.token;

    const entry = await prisma.blackList.findUnique({
      where: { token },
    });

    reply.send({ blacklisted: !!entry });
  });
};

export default fp(blacklistRoutes);

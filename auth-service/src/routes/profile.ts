import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../authMiddleware';

export default function profileRoutes(server: FastifyInstance, prisma: PrismaClient) {
	// Get user profile by ID
	server.get('/api/profile/:id', async (request, reply) => {
		const { id } = request.params as { id: string };

		const user = await prisma.user.findUnique({
			where: { id: Number(id) },
			select: {
				id: true,
				email: true,
				username: true,
				alias: true,
				avatar: true,
				created_at: true
			}
		});

		if (!user) return reply.status(404).send({ error: 'User not found.' });
		return { user };
	});

	// Update user profile (protected)
	server.put('/api/profile', { preHandler: authMiddleware }, async (request, reply) => {
		if (!request.user || !('id' in request.user)) {
			return reply.status(401).send({ error: 'Unauthorized' });
		}
		const userId = (request.user as any).id;
		const { alias, avatar } = request.body as { alias?: string; avatar?: string };

		await prisma.user.update({
			where: { id: userId },
			data: { alias, avatar }
		});

		return { message: 'Profile updated.' };
	});
}

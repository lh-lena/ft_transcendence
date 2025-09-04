import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../auth/authMiddleware';

export default function profileRoutes(server: FastifyInstance, apiClientBackend: any) {
	// Get user profile by ID
	server.get('/api/profile/:id', async (request, reply) => {
		const { id } = request.params as { id: string };

		try {
			const response = await apiClientBackend.get(`/user/${id}`);
			if (!response.data) return reply.status(404).send({ error: 'User not found.' });
			return { user: response.data };
		} catch (err) {
			return reply.status(404).send({ error: 'User not found.' });
		}
	});

	// Update user profile (protected)
	server.put('/api/profile', { preHandler: authMiddleware }, async (request, reply) => {
		if (!request.user || !('id' in request.user)) {
			return reply.status(401).send({ error: 'Unauthorized' });
		}
		const userId = (request.user as any).id;
		const { alias, avatar } = request.body as { alias?: string; avatar?: string };

		try {
			await apiClientBackend.put(`/user/${userId}`, { alias, avatar });
			return { message: 'Profile updated.' };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to update profile.' });
		}
	});
}

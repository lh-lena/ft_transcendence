import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../auth/authMiddleware';
import axios from 'axios';

export default function statsRoutes(server: FastifyInstance, apiClientBackend: any) {
	// Get stats for current user
	server.get('/api/stats/me', { preHandler: authMiddleware }, async (request, reply) => {
		const userId = (request.user as any).id;
		try {
			const response = await apiClientBackend.get(`/stats/${userId}`);
			return { stats: response.data };
		} catch (err) {
			return reply.status(404).send({ error: 'Stats not found.' });
		}
	});

	// Get stats for any user by ID
	server.get('/api/stats/:id', async (request, reply) => {
		const { id } = request.params as { id: string };
		try {
			const response = await apiClientBackend.get(`/stats/${id}`);
			return { stats: response.data };
		} catch (err) {
			return reply.status(404).send({ error: 'Stats not found.' });
		}
	});
}

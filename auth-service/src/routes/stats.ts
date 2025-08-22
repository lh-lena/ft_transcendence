import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../authMiddleware';

export default function statsRoutes(server: FastifyInstance, db: any) {
	// Get stats for current user
	server.get('/api/stats/me', { preHandler: authMiddleware }, async (request, reply) => {
		const userId = (request.user as any).id;
		const stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
		if (!stats) return reply.status(404).send({ error: 'Stats not found.' });
		return { stats };
	});

	// (Optional) Get stats for any user by ID
	server.get('/api/stats/:id', async (request, reply) => {
		const { id } = request.params as { id: string };
		const stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(id);
		if (!stats) return reply.status(404).send({ error: 'Stats not found.' });
		return { stats };
	});
}

import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../auth/authMiddleware';

export default function friendsRoutes(server: FastifyInstance, apiClientBackend: any) {
	// Send friend request
	server.post('/api/friends/request', { preHandler: authMiddleware }, async (request, reply) => {
		const { friend_id } = request.body as { friend_id: number };
		const userId = (request.user as any).id;
		if (userId === friend_id) return reply.status(400).send({ error: 'Cannot add yourself.' });

		try {
			await apiClientBackend.post(`/friends/request`, { user_id: userId, friend_id });
			return { message: 'Friend request sent.' };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to send friend request.' });
		}
	});

	// Accept friend request
	server.post('/api/friends/accept', { preHandler: authMiddleware }, async (request, reply) => {
		const { friend_id } = request.body as { friend_id: number };
		const userId = (request.user as any).id;

		try {
			await apiClientBackend.post(`/friends/accept`, { user_id: userId, friend_id });
			return { message: 'Friend request accepted.' };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to accept friend request.' });
		}
	});

	// List friends
	server.get('/api/friends', { preHandler: authMiddleware }, async (request, reply) => {
		const userId = (request.user as any).id;
		try {
			const response = await apiClientBackend.get(`/friends/${userId}`);
			return { friends: response.data };
		} catch (err) {
			return reply.status(500).send({ error: 'Failed to fetch friends.' });
		}
	});
}

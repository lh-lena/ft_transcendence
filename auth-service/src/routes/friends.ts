import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../authMiddleware';

export default function friendsRoutes(server: FastifyInstance, db: any) {
  // Send friend request
  server.post('/api/friends/request', { preHandler: authMiddleware }, async (request, reply) => {
    const { friend_id } = request.body as { friend_id: number };
    const userId = (request.user as any).id;
    if (userId === friend_id) return reply.status(400).send({ error: 'Cannot add yourself.' });
    db.prepare('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)').run(
      userId,
      friend_id,
      'pending',
    );
    return { message: 'Friend request sent.' };
  });

  // Accept friend request
  server.post('/api/friends/accept', { preHandler: authMiddleware }, async (request, reply) => {
    const { friend_id } = request.body as { friend_id: number };
    const userId = (request.user as any).id;
    db.prepare('UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?').run(
      'accepted',
      friend_id,
      userId,
    );
    return { message: 'Friend request accepted.' };
  });

  // List friends
  server.get('/api/friends', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as any).id;
    const friends = db
      .prepare('SELECT friend_id FROM friends WHERE user_id = ? AND status = ?')
      .all(userId, 'accepted');
    return { friends };
  });
}

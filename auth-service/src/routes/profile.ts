import { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { authMiddleware } from '../authMiddleware'; // Import your middleware

export default function profileRoutes(server: FastifyInstance, db: InstanceType<typeof Database>) {
  // Get user profile by ID
  server.get('/api/profile/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = db
      .prepare('SELECT id, email, username, alias, avatar, created_at FROM user WHERE id = ?')
      .get(id);
    if (!user) return reply.status(404).send({ error: 'User not found.' });
    return { user };
  });

  // Update user profile (protected, needs authMiddleware)
  server.put('/api/profile', { preHandler: authMiddleware }, async (request, reply) => {
    // Make sure request.user exists and has an id
    if (!request.user || !('id' in request.user)) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const userId = (request.user as any).id;
    const { alias, avatar } = request.body as { alias?: string; avatar?: string };
    db.prepare('UPDATE user SET alias = ?, avatar = ? WHERE id = ?').run(alias, avatar, userId);
    return { message: 'Profile updated.' };
  });
}

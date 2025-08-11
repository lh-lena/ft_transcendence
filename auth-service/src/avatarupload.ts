import { FastifyInstance } from 'fastify';
import { authMiddleware } from './authMiddleware';
import { promises as fs } from 'fs';
import path from 'path';

export default function avatarRoutes(server: FastifyInstance, db: any) {
  server.post('/api/profile/avatar', { preHandler: authMiddleware }, async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded.' });

    // Save file to disk
    const userId = (request.user as any).id;
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `${userId}_${Date.now()}_${data.filename}`);
    await fs.writeFile(filePath, await data.toBuffer());

    // Save file path (or URL) to user.avatar
    db.prepare('UPDATE user SET avatar = ? WHERE id = ?').run(filePath, userId);

    return { message: 'Avatar uploaded.', avatar: filePath };
  });
}

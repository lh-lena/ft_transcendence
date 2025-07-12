import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT } from './jwt';
import Database from 'better-sqlite3';

const db = new Database('../backend/src/database/database.sqlite');

export function authMiddleware(request: FastifyRequest, reply: FastifyReply, done: () => void) {
	const authHeader = request.headers['authorization'];
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		reply.status(401).send({ error: 'Missing or invalid Authorization header.' });
		return;
	}
	const token = authHeader.split(' ')[1];
	try {
		const payload = verifyJWT(token);
		// Fetch user from DB using payload.sub
		const user = db.prepare('SELECT * FROM user WHERE id = ?').get(payload.sub);
		if (!user) {
			reply.status(401).send({ error: 'User not found.' });
			return;
		}
		(request as any).user = user;
		done();
	} catch (err) {
		reply.status(401).send({ error: 'Invalid or expired token.' });
	}
}

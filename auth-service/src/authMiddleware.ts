import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT } from './jwt';

export function authMiddleware(request: FastifyRequest, reply: FastifyReply, done: () => void) {
	const authHeader = request.headers['authorization'];
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		reply.status(401).send({ error: 'Missing or invalid Authorization header.' });
		return;
	}
	const token = authHeader.split(' ')[1];
	try {
		const payload = verifyJWT(token);
		// Attach user info to request for downstream handlers
		(request as any).user = payload;
		done();
	} catch (err) {
		reply.status(401).send({ error: 'Invalid or expired token.' });
	}
}

import Fastify from 'fastify';
import Database from 'better-sqlite3';
import { hashPassword, verifyPassword } from './passwords';
import { generateJWT } from './jwt';
import { authMiddleware } from './authMiddleware';

const server = Fastify({ logger: true });
const db = new Database('users.db');

type User = {
	id: number;
	email: string;
	username: string;
	alias?: string;
	password_hash: string;
	is_2fa_enabled: number;
	twofa_secret?: string | null;
	created_at: string;
	updated_at: string;
};

// Health check endpoint
server.get('/api/auth/health', async (request, reply) => {
	return {
		status: 'ok',
		service: 'auth-service',
		message: 'Auth service running on port 8082'
	};
});

// Registration endpoint
server.post('/api/auth/register', async (request, reply) => {
	const { email, username, password, alias } = request.body as { email?: string, username?: string, password?: string, alias?: string };

	if (!email || !username || !password) {
		return reply.status(400).send({ error: 'Email, username, and password are required.' });
	}
	if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
		return reply.status(400).send({ error: 'Invalid email format.' });
	}
	if (username.length < 3 || username.length > 32) {
		return reply.status(400).send({ error: 'Username must be 3-32 characters.' });
	}
	if (password.length < 6) {
		return reply.status(400).send({ error: 'Password must be at least 6 characters.' });
	}

	// 2. Check if email or username already exists
	const exists = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
	if (exists) {
		return reply.status(409).send({ error: 'Email or username already in use.' });
	}

	let password_hash: string;
	try {
		password_hash = await hashPassword(password);
	} catch (err) {
		server.log.error(err);
		return reply.status(500).send({ error: 'Failed to hash password.' });
	}

	try {
		db.prepare(
			'INSERT INTO users (email, username, alias, password_hash) VALUES (?, ?, ?, ?)'
		).run(email, username, alias, password_hash);
	} catch (err) {
		server.log.error(err);
		return reply.status(500).send({ error: 'Failed to create user.' });
	}

	return reply.status(201).send({ message: 'User registered successfully.' });
});

// Login endpoint
server.post('/api/auth/login', async (request, reply) => {
	const { email, password } = request.body as { email?: string, password?: string };

	if (!email || !password) {
		return reply.status(400).send({ error: 'Email and password are required.' });
	}

	const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
	if (!user) {
		return reply.status(401).send({ error: 'Invalid credentials.' });
	}

	const valid = await verifyPassword(user.password_hash, password);
	if (!valid) {
		return reply.status(401).send({ error: 'Invalid credentials.' });
	}

	const token = generateJWT({
		sub: user.id,
		username: user.username,
		email: user.email,
		alias: user.alias,
		is_2fa_enabled: user.is_2fa_enabled
	});

	return reply.send({ token });
});

// Logout endpoint
server.post('/api/auth/logout', async (request, reply) => {
	return reply.send({ message: 'Logged out. Please delete your token on the client.' });
});

// Get user info endpoint (who am I?)
// This endpoint is protected by the authMiddleware
server.get('/api/auth/me', { preHandler: authMiddleware }, async (request, reply) => {
    return { user: request.user };
});

const start = async () => {
	try {
		await server.listen({ port: 8082, host: '0.0.0.0' });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

start();

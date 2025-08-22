// import Fastify from 'fastify';
// import Database from 'better-sqlite3';
// import { hashPassword, verifyPassword } from './passwords';
// import { generateJWT } from './jwt';
// import { authMiddleware } from './authMiddleware';
// import profileRoutes from './routes/profile';
// import avatarRoutes from './avatarupload';
// import friendsRoutes from './routes/friends';
// import fastifyMultipart from '@fastify/multipart';
// import statsRoutes from './routes/stats';
// import fastifyOauth2 from '@fastify/oauth2';

// const server = Fastify({ logger: true });
// const db = new Database(':memory:');

// // Create user table if it doesn't exist
// db.exec(`
// CREATE TABLE IF NOT EXISTS user (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   email TEXT UNIQUE NOT NULL,
//   username TEXT UNIQUE NOT NULL,
//   alias TEXT,
//   password_hash TEXT NOT NULL,
//   is_2fa_enabled INTEGER DEFAULT 0,
//   twofa_secret TEXT,
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
// );
// `);


// type User = {
// 	id: number;
// 	email: string;
// 	username: string;
// 	alias?: string;
// 	password_hash: string;
// 	is_2fa_enabled: number;
// 	twofa_secret?: string | null;
// 	created_at: string;
// 	updated_at: string;
// };

// // Register multipart plugin, so can add avatar images and multi part forms
// server.register(fastifyMultipart);

// // Register Google OAuth2 plugin
// server.register(fastifyOauth2, {
//   name: 'googleOAuth2',
//   scope: ['profile', 'email'],
//   credentials: {
//     client: {
//       id: process.env.GOOGLE_CLIENT_ID!,
//       secret: process.env.GOOGLE_CLIENT_SECRET!,
//     },
//     auth: fastifyOauth2.GOOGLE_CONFIGURATION,
//   },
//   startRedirectPath: '/api/auth/google',
//   callbackUri: 'http://localhost:8082/api/auth/google/callback',
// });

// // Health check endpoint
// server.get('/api/auth/health', async (request, reply) => {
// 	return {
// 		status: 'ok',
// 		service: 'auth-service',
// 		message: 'Auth service running on port 8082'
// 	};
// });

// // Registration endpoint
// server.post('/api/auth/register', async (request, reply) => {
// 	const { email, username, password, alias } = request.body as { email?: string, username?: string, password?: string, alias?: string };

// 	if (!email || !username || !password) {
// 		return reply.status(400).send({ error: 'Email, username, and password are required.' });
// 	}
// 	if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
// 		return reply.status(400).send({ error: 'Invalid email format.' });
// 	}
// 	if (username.length < 3 || username.length > 32) {
// 		return reply.status(400).send({ error: 'Username must be 3-32 characters.' });
// 	}
// 	if (password.length < 6) {
// 		return reply.status(400).send({ error: 'Password must be at least 6 characters.' });
// 	}

// 	// 2. Check if email or username already exists
// 	const exists = db.prepare('SELECT id FROM user WHERE email = ? OR username = ?').get(email, username);
// 	if (exists) {
// 		return reply.status(409).send({ error: 'Email or username already in use.' });
// 	}

// 	let password_hash: string;
// 	try {
// 		password_hash = await hashPassword(password);
// 	} catch (err) {
// 		server.log.error(err);
// 		return reply.status(500).send({ error: 'Failed to hash password.' });
// 	}

// 	try {
// 		db.prepare(
// 			'INSERT INTO user (email, username, password_hash) VALUES (?, ?, ?)'
// 		).run(email, username, password_hash);
// 	} catch (err) {
// 		server.log.error(err);
// 		return reply.status(500).send({ error: 'Failed to create user.' });
// 	}

// 	return reply.status(201).send({ message: 'User registered successfully.' });
// });

// // Login endpoint
// server.post('/api/auth/login', async (request, reply) => {
// 	const { email, password } = request.body as { email?: string, password?: string };

// 	if (!email || !password) {
// 		return reply.status(400).send({ error: 'Email and password are required.' });
// 	}

// 	const user = db.prepare('SELECT * FROM user WHERE email = ?').get(email) as User | undefined;
// 	if (!user) {
// 		return reply.status(401).send({ error: 'Invalid credentials.' });
// 	}

// 	const valid = await verifyPassword(user.password_hash, password);
// 	if (!valid) {
// 		return reply.status(401).send({ error: 'Invalid credentials.' });
// 	}

// 	const token = generateJWT({
// 		sub: user.id,
// 		username: user.username,
// 		email: user.email,
// 		alias: user.alias,
// 		is_2fa_enabled: user.is_2fa_enabled
// 	});

// 	return reply.send({ token });
// });

// // Logout endpoint
// server.post('/api/auth/logout', async (request, reply) => {
// 	return reply.send({ message: 'Logged out. Please delete your token on the client.' });
// });

// // Get user info endpoint (who am I?)
// // This endpoint is protected by the authMiddleware
// server.get('/api/auth/me', { preHandler: authMiddleware }, async (request, reply) => {
//     return { user: request.user };
// });

// // Stats endpoint: returns number of users
// server.get('/api/auth/stats', async (request, reply) => {
//     const count = db.prepare('SELECT COUNT(*) as userCount FROM user').get();
//     return { userCount: count.userCount };
// });

// // Define the expected Google profile type
// type GoogleProfile = {
//   email: string;
//   name: string;
//   // add more fields if needed
// };

// // OAuth callback handler
// server.get('/api/auth/google/callback', async (request, reply) => {
//   const token = await (server as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

//   // Fetch user info from Google
//   const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
//     headers: { Authorization: `Bearer ${token.token.access_token}` }
//   });
//   const profile = await userInfoRes.json() as GoogleProfile;

//   // Link or create user in your DB
//   let user = db.prepare('SELECT * FROM user WHERE email = ?').get(profile.email) as User | undefined;
//   if (!user) {
//     db.prepare(
//       'INSERT INTO user (email, username, password_hash) VALUES (?, ?, ?)'
//     ).run(profile.email, profile.name, '');
//     user = db.prepare('SELECT * FROM user WHERE email = ?').get(profile.email) as User | undefined;
//   }

//   // Generate JWT for your app
//   const appToken = generateJWT({
//     sub: user.id,
//     username: user.username,
//     email: user.email,
//     alias: user.alias,
//     is_2fa_enabled: user.is_2fa_enabled
//   });

//   // Redirect to frontend with token (or set cookie)
//   reply.redirect(`http://localhost:3000/?token=${appToken}`);
// });

// profileRoutes(server, db);
// avatarRoutes(server, db);
// friendsRoutes(server, db);
// statsRoutes(server, db);

// const start = async () => {
// 	try {
// 		await server.listen({ port: 8082, host: '0.0.0.0' });
// 	} catch (err) {
// 		server.log.error(err);
// 		process.exit(1);
// 	}
// };

// start();


import Fastify from 'fastify';
import { hashPassword, verifyPassword } from './passwords';
import { generateJWT } from './jwt';
import { authMiddleware } from './authMiddleware';
import profileRoutes from './routes/profile';
import avatarRoutes from './avatarupload';
import friendsRoutes from './routes/friends';
import fastifyMultipart from '@fastify/multipart';
import statsRoutes from './routes/stats';
import fastifyOauth2 from '@fastify/oauth2';
import { PrismaClient } from '@prisma/client';

const server = Fastify({ logger: true });

// Prisma client pointing to backend/prisma/schema.prisma DB
const prisma = new PrismaClient();

// Register multipart plugin
server.register(fastifyMultipart);

// Register Google OAuth2 plugin
server.register(fastifyOauth2, {
  name: 'googleOAuth2',
  scope: ['profile', 'email'],
  credentials: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID!,
      secret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    auth: fastifyOauth2.GOOGLE_CONFIGURATION,
  },
  startRedirectPath: '/api/auth/google',
  callbackUri: 'http://localhost:8082/api/auth/google/callback',
});

// Health check endpoint
server.get('/api/auth/health', async () => ({
  status: 'ok',
  service: 'auth-service',
  message: 'Auth service running on port 8082'
}));

// Registration endpoint
server.post('/api/auth/register', async (request, reply) => {
  const { email, username, password, alias } = request.body as {
    email?: string;
    username?: string;
    password?: string;
    alias?: string;
  };

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

  // Check if email or username already exists
  const exists = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  });
  if (exists) {
    return reply.status(409).send({ error: 'Email or username already in use.' });
  }

  // Hash password
  let password_hash: string;
  try {
    password_hash = await hashPassword(password);
  } catch (err) {
    server.log.error(err);
    return reply.status(500).send({ error: 'Failed to hash password.' });
  }

  // Create user
  try {
    await prisma.user.create({
      data: {
        email,
        username,
        password_hash,
        // Optional alias if you add it to schema
        ...(alias && { alias })
      }
    });
  } catch (err) {
    server.log.error(err);
    return reply.status(500).send({ error: 'Failed to create user.' });
  }

  return reply.status(201).send({ message: 'User registered successfully.' });
});

// Login endpoint
server.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body as { email?: string; password?: string };

  if (!email || !password) {
    return reply.status(400).send({ error: 'Email and password are required.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
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
    alias: (user as any).alias, // only works if alias is in schema
    is_2fa_enabled: user.is_2fa_enabled
  });

  return reply.send({ token });
});

// Logout endpoint
server.post('/api/auth/logout', async () => {
  return { message: 'Logged out. Please delete your token on the client.' };
});

// Who am I endpoint
server.get('/api/auth/me', { preHandler: authMiddleware }, async (request) => {
  return { user: request.user };
});

// Stats endpoint
server.get('/api/auth/stats', async () => {
  const count = await prisma.user.count();
  return { userCount: count };
});

// Google OAuth callback
type GoogleProfile = {
  email: string;
  name: string;
};

server.get('/api/auth/google/callback', async (request, reply) => {
  const token = await (server as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token.token.access_token}` }
  });
  const profile = await userInfoRes.json() as GoogleProfile;

  let user = await prisma.user.findUnique({ where: { email: profile.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        username: profile.name,
        password_hash: '' // no password for OAuth users
      }
    });
  }

  const appToken = generateJWT({
    sub: user.id,
    username: user.username,
    email: user.email,
    alias: (user as any).alias,
    is_2fa_enabled: user.is_2fa_enabled
  });

  reply.redirect(`http://localhost:3000/?token=${appToken}`);
});

// Pass prisma to route modules
profileRoutes(server, prisma);
avatarRoutes(server, prisma);
friendsRoutes(server, prisma);
statsRoutes(server, prisma);

const start = async () => {
  try {
    await server.listen({ port: 8082, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();


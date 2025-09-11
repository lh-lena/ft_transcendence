import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { hashPassword, verifyPassword } from '../auth/passwords';
import { generateJWT, generateRefreshToken, verifyJWT } from '../auth/jwt';
import { authMiddleware } from '../auth/authMiddleware';
import { loadUserByEmail, isBlacklisted, apiClientBackend } from '../services/userService';
import { sendMail } from '../services/mailer';
import { generate6DigitCode, nowPlusMinutes } from '../services/twofa';
import { z } from 'zod/v4';

export default async function authRoutes(server: FastifyInstance) {
  const registerSchema = z.object({
    email: z.email(),
    username: z.string().min(3).max(32),
    password: z.string().min(6),
    alias: z.string().optional(),
  });
  const loginSchema = z.object({ email: z.email(), password: z.string().min(6) });

  // Registration
  server.post('/api/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = registerSchema.safeParse(req.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.issues });
    }

    const { email, username, password, alias } = parseResult.data;

    const password_hash = await hashPassword(password);

    await apiClientBackend.post('/user', {
      email,
      username,
      alias,
      password_hash,
      is_2fa_enabled: false,
      twofa_method: null,
      twofa_temp_code: null,
      twofa_code_expires: null,
      twofa_secret: null,
      backup_codes: [],
      marketingEmails: false,
      dataSharingConsent: false,
    });

    return reply.status(201).send({ message: 'User registered successfully' });
  });

  // Login
  server.post('/api/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.issues });
    }

    const { email, password } = parseResult.data;

    const user = await loadUserByEmail(email);
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' });

    const valid = await verifyPassword(user.password_hash, password);
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' });

    // 2FA check
    if (user.is_2fa_enabled && user.twofa_method === 'email') {
      const code = generate6DigitCode();
      const expires = nowPlusMinutes(5);

      await apiClientBackend.put(`/user/${user.id}`, {
        twofa_temp_code: code,
        twofa_code_expires: expires,
      });

      await sendMail(user.email, 'Your 2FA Code', `Code: ${code}`);
      return reply.send({ requires2fa: true, method: 'email' });
    }

    const accessToken = generateJWT({
      sub: user.id,
      username: user.username,
      email: user.email,
      alias: user.alias ?? undefined,
      is_2fa_enabled: user.is_2fa_enabled,
    });
    const refreshToken = generateRefreshToken({
      sub: user.id,
      username: user.username,
      email: user.email,
      is_2fa_enabled: user.is_2fa_enabled,
    });

    reply.setCookie('refreshToken', refreshToken, { httpOnly: true, path: '/api/auth/refresh' });
    return reply.send({ accessToken });
  });

  // Refresh token
  server.post('/api/auth/refresh', async (req, reply) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return reply.status(401).send({ error: 'No refresh token' });
    if (await isBlacklisted(refreshToken))
      return reply.status(401).send({ error: 'Token revoked' });

    try {
      const payload = verifyJWT(refreshToken, process.env.REFRESH_TOKEN_SECRET!);
      const newAccessToken = generateJWT(payload);
      const newRefreshToken = generateRefreshToken(payload);
      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        path: '/api/auth/refresh',
      });
      return reply.send({ accessToken: newAccessToken });
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  // Me
  server.get('/api/auth/me', { preHandler: authMiddleware }, async (req, reply) => {
    const user = (req as any).user;
    return { user };
  });
}

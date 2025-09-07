import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyJWT } from './jwt';
import { config } from '../config';
import { AuthenticatedRequest } from '../types';
import { isBlacklisted } from '../services/userService';

import axios from 'axios';

// Use the same backend API client as in server.ts
const apiClientBackend = axios.create({
  baseURL: 'http://backend:8080/api',
  timeout: 5000,
});

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return reply.status(401).send({ error: 'Missing authorization header' });

  const token = authHeader.split(' ')[1];
  if (!token) return reply.status(401).send({ error: 'Missing token' });
  if (await isBlacklisted(token)) return reply.status(401).send({ error: 'Token revoked' });

  try {
    const payload = verifyJWT(token, process.env.ACCESS_TOKEN_SECRET!);
    (req as AuthenticatedRequest).user = payload;
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

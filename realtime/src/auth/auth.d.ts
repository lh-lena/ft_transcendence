import type { VerifyClientInfo } from 'fastify';
import type { User } from '../schemas/user.schema.js';

export interface AuthService {
  verifyClient(info: VerifyClientInfo): Promise<boolean>;
  validateUser(token: string): Promise<User | null>;
}

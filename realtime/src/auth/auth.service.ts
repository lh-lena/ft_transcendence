import type { FastifyInstance, VerifyClientInfo, FastifyRequest, FastifyReply } from 'fastify';
import { parse as parseCookie } from 'cookie';
import type { EnvironmentConfig } from '../config/config.js';
import type { User } from '../schemas/user.schema.js';
import { UserSchema } from '../schemas/user.schema.js';
import { processDebugLog } from '../utils/error.handler.js';
import type { AuthService } from './auth.js';

export default function createAuthService(app: FastifyInstance): AuthService {
  const { log } = app;
  const config = app.config as EnvironmentConfig;

  async function validateUser(token: string): Promise<User | null> {
    try {
      const AUTH_URL = config.websocket.authUrl;
      if (!AUTH_URL) {
        log.error('[auth-service] AUTH_URL not configured');
        return null;
      }
      const authUrl = `${AUTH_URL}/api/auth/me`;

      const res = await fetch(authUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        log.debug(`[auth-service] Token validation failed: ${res.status} ${res.statusText}`);
        return null;
      }
      const rawUserData = await res.json();
      const validationResult = UserSchema.safeParse(rawUserData);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map((err) => err.message).join(', ');
        log.debug(
          `[auth-service] Invalid user data received from auth service. Data: ${JSON.stringify(rawUserData)}. Errors: ${errorMessages}`,
        );
        return null;
      }
      const user = validationResult.data;
      return user;
    } catch (error: unknown) {
      processDebugLog(app, 'auth-service', 'Error validating user: ', error);
      return null;
    }
  }

  async function verifyClient(info: VerifyClientInfo): Promise<boolean> {
    log.debug(
      `[auth-service]: Attempting client verification for origin: ${info.origin}, secure: ${info.secure}`,
    );
    try {
      if (info.origin && !isAllowedOrigin(info.origin, config.websocket.allowedOrigins)) {
        log.debug(`[auth-service]: Connection rejected - Forbidden Origin: ${info.origin}`);
        return false;
      }

      // TODO: Keep only this check for production !info.secure
      if (
        !info.secure &&
        info.origin !== undefined &&
        !info.origin.includes('127.0.0.1') &&
        !info.origin.includes('localhost')
      ) {
        log.debug(
          '[auth-service]: Connection rejected - Only secure (WSS) connections are allowed',
        );
        return false;
      }

      const token = extractTokenFromRequest(info);
      if (token === null) {
        log.debug('[auth-service] Connection rejected - No authentication token provided');
        return false;
      }
      const user = await validateUser(token);
      if (!user) {
        processDebugLog(
          app,
          'auth-service',
          `Connection rejected - Invalid token or expired authentication credentials: ${user}`,
        );
        return false;
      }

      info.req.socket._user = user;
      log.debug(`auth-service: Finished verification for user ID ${user.userId}`);
      return true;
    } catch (error: unknown) {
      processDebugLog(app, 'auth-service', 'Error verifying client:', error);
      return false;
    }
  }

  function verifyServerOrigin(
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void,
  ): void {
    const origin = request.headers.origin;

    if (origin !== undefined && isAllowedOrigin(origin, config.websocket.allowedServiceIPs)) {
      request.server.log.debug(`[auth-service] Server origin verified successfully: ${origin}`);
      return done();
    }

    request.server.log.debug(`[auth-service] Server origin rejected: ${origin}`);
    reply.code(403).send({ success: false, message: 'Forbidden: Origin not allowed' });
  }

  function isAllowedOrigin(origin: string, expectedOrigins: string[]): boolean {
    return expectedOrigins.includes(origin);
  }

  function extractTokenFromRequest(info: VerifyClientInfo): string | null {
    const cookieToken = extractTokenFromCookie(info);
    if (cookieToken !== null) {
      return cookieToken;
    }
    return extractTokenFromQuery(info);
  }

  function extractTokenFromCookie(info: VerifyClientInfo): string | null {
    const cookieHeader = info.req.headers.cookie;
    if (cookieHeader === undefined) {
      return null;
    }

    const cookies = parseCookie(cookieHeader);
    const token = cookies['token'] as string | null;

    if (token === null || token === '') {
      return null;
    }
    log.debug('[auth-service]: Token extracted from cookies successfully');
    return token;
  }

  function extractTokenFromQuery(info: VerifyClientInfo): string | null {
    const urlPath = info.req.url !== undefined ? info.req.url : '';
    const url = new URL(urlPath, `http://${info.req.headers.host}`);
    const searchParams = url.searchParams;
    const token = searchParams.get('token');
    if (token === null || token === '') {
      return null;
    }
    log.debug('[auth-service]: Token extracted from the query successfully');
    return token;
  }

  return {
    verifyClient,
    validateUser,
    verifyServerOrigin,
  };
}

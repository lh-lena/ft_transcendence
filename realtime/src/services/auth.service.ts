import { FastifyInstance, VerifyClientInfo } from 'fastify';
import cookie from 'cookie';
import { User, UserSchema } from '../schemas/user.schema.js';

export default function authService(app: FastifyInstance) {
  async function validateUser(token: string): Promise<User | null> {
    try {
      const AUTH_URL = app.config.websocket.authUrl;
      if (!AUTH_URL) {
        app.log.error('[auth-service] AUTH_URL not configured');
        return null;
      }
      const res = await fetch(`${AUTH_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        app.log.warn(
          `[auth-service] Token validation failed: ${res.status} ${res.statusText}`,
        );
        return null;
      }
      const rawUserData = await res.json();
      const validationResult = UserSchema.safeParse(rawUserData);
      if (!validationResult.success) {
        app.log.warn(
          `[auth-service] Invalid user data received from auth service. Data: ${rawUserData}. Errors: ${validationResult.error.errors.map((err) => err.message).join(', ')}`,
        );
        return null;
      }
      const user = validationResult.data;
      return user;
    } catch (error) {
      app.log.error(
        `[auth-service] Error validating user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  async function verifyClient(info: VerifyClientInfo): Promise<boolean> {
    app.log.debug(
      `[auth-service]: Attempting client verification for origin: ${info.origin}, secure: ${info.secure}`,
    );
    try {
      // if (info.origin && !isAllowedOrigin(info.origin)) {
      //   app.log.warn(
      //     `[auth-service]: Connection rejected - Forbidden Origin: ${info.origin}`,
      //   );
      //   return false;
      // }


      // if (!info.secure && !info.origin.includes('127.0.0.1')) {
      //   app.log.warn(
      //     '[auth-service]: Connection rejected - Only secure (WSS) connections are allowed.',
      //   );
      //   return false;
      // }

      // const token = extractTokenFromRequest(info);
      // if (!token) {
      //   app.log.warn(
      //     '[auth-service] Connection rejected - No authentication token provided',
      //   );
      //   return false;
      // }

      const user: User = {
        userId: 0,
        username: 'n/a',
        userAlias: 'n/a'
      };

      if (info.origin.endsWith('3000')) {
        const userOne = user;
        userOne.userId = 0;
      }

      if (info.origin.endsWith('3001')) {
        const userOne = user;
        userOne.userId = 1;
      }

      if (!user) {
        app.log.debug(
          '[auth-service]: Connection rejected: Invalid token or expired authentication credentials.',
        );
        return false;
      }

      (info.req.socket as any)._user = user;
      // app.log.debug(
      //   `[auth-service]: Finished verification for user ${user.userId}`,
      // );
      return true;
    } catch (error) {
      app.log.debug('[auth-service]: Error verifying client:', error);
      return false;
    }
  }

  function isAllowedOrigin(origin: string): boolean {
    const expectedOrigins = app.config.websocket.allowedOrigins;
    return expectedOrigins.includes(origin);
  }

  function extractTokenFromRequest(info: VerifyClientInfo): string | null {
    const cookieHeader = info.req.headers.cookie;
    if (!cookieHeader) {
      app.log.warn('[auth-service]: No cookie header found in request');
      return null;
    }

    const cookies = cookie.parse(cookieHeader);
    const token = cookies['token'] as string | undefined;

    if (!token) {
      app.log.warn('[auth-service]: No token found in cookies');
      return null;
    }

    return token;
  }

  return {
    verifyClient,
    validateUser,
  };
}

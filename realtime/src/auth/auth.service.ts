import type { FastifyInstance, VerifyClientInfo } from 'fastify';
import { parse as parseCookie } from 'cookie';
import type { EnvironmentConfig } from '../config/config.js';
import { User, UserSchema, UserIdType, UserIdObjectSchema } from '../schemas/user.schema.js';
import { processDebugLog, processErrorLog, processInfoLog } from '../utils/error.handler.js';
import type { AuthService } from './auth.js';

export default function createAuthService(app: FastifyInstance): AuthService {
  const config = app.config as EnvironmentConfig;

  async function getUserInfo(id: UserIdType): Promise<User | null> {
    if (id === undefined || id === null) {
      processErrorLog(app, 'auth-service', `User ID is undefined or null`);
      return null;
    }
    const backendUrl = config.websocket.backendUrl;

    const res = await fetch(`${backendUrl}/api/user/${id}`);
    if (res.status !== 200) {
      processErrorLog(
        app,
        'auth-service',
        `Failed to get user info: ${res.status} ${res.statusText}`,
      );
      return null;
    }
    const rawUserData = await res.json();
    const validationResult = UserSchema.safeParse(rawUserData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((err) => err.message).join(', ');
      processErrorLog(app, 'auth-service', `Invalid user data received from auth service`);
      processDebugLog(
        app,
        'auth-service',
        `Data: ${JSON.stringify(rawUserData)} Errors: ${errorMessages}`,
      );
      return null;
    }
    return validationResult.data;
  }

  async function validateUser(token: string): Promise<User | null> {
    try {
      const AUTH_URL = config.websocket.authUrl;
      if (!AUTH_URL) {
        processErrorLog(app, 'auth-service', `AUTH_URL not configured`);
        return null;
      }
      const authUrl = `${AUTH_URL}/api/auth/me`;

      processInfoLog(
        app,
        'auth-service',
        `Token found in validateUser, ${token} starting validation`,
      );
      const res = await fetch(authUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status !== 200) {
        processErrorLog(
          app,
          'auth-service',
          `Token validation failed: ${res.status} ${res.statusText}`,
        );
      }
      const rawUserData = await res.json();
      const validationResult = UserIdObjectSchema.safeParse(rawUserData);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map((err) => err.message).join(', ');
        processErrorLog(app, 'auth-service', `Invalid user data received from auth service`);
        processDebugLog(
          app,
          'auth-service',
          `Data: ${JSON.stringify(rawUserData)} Errors: ${errorMessages}`,
        );
        return null;
      }
      const userId = validationResult.data.userId as UserIdType;
      const user = await getUserInfo(userId);
      return user;
    } catch (error: unknown) {
      processDebugLog(app, 'auth-service', 'Error validating user: ', error);
      return null;
    }
  }

  async function verifyClient(info: VerifyClientInfo): Promise<boolean> {
    processDebugLog(
      app,
      'auth-service',
      `Attempting client verification for origin: ${info.origin}, secure: ${info.secure}`,
    );
    try {
      const token = extractTokenFromRequest(info);
      if (token === null) {
        processErrorLog(
          app,
          'auth-service',
          `Connection rejected - No authentication token provided`,
        );
        return false;
      }
      processInfoLog(app, 'auth-service', `Token found, ${token} starting validation`);
      const user = await validateUser(token);
      if (!user) {
        processErrorLog(
          app,
          'auth-service',
          `Connection rejected - Invalid token or expired authentication credentials: ${user}`,
        );
        return false;
      }
      info.req.socket._user = user;
      processDebugLog(app, 'auth-service', `Finished verification for user ID ${user.userId}`);
      return true;
    } catch (error: unknown) {
      processDebugLog(app, 'auth-service', 'Error verifying client:', error);
      return false;
    }
  }

  function extractTokenFromRequest(info: VerifyClientInfo): string | null {
    // const cookieToken = extractTokenFromCookie(info);
    // if (cookieToken !== null) {
    //   return cookieToken;
    // }
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
    processDebugLog(app, 'auth-service', `Token extracted from cookies successfully`);
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
    processDebugLog(app, 'auth-service', `Token extracted from the query successfully`);
    return token;
  }

  return {
    verifyClient,
    validateUser,
    getUserInfo,
  };
}

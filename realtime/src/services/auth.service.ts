import { FastifyInstance, VarifyClientInfo } from 'fastify';
import { parse } from 'url';
import cookie from 'cookie';
import { IncomingMessage } from 'http';
import { User } from '../pong-core/pong.types.js';

export default function authService(app: FastifyInstance) {
  let i = 0;

  async function validateUser(tocken: string): Promise<User | null> {
    const AUTH_URL = app.config.websocket.authUrl;
    // const res = await fetch(`${AUTH_URL}/api/user/:${tocken}`);

    // if (!res.ok) return null;

    // const data = await res.json();
    const data = {
      userId: i++,
      username: 'n/a',
      userAlias: 'n/a'
    } as User;
    return data;
  }

  async function verifyClient(info: VarifyClientInfo): Promise<boolean> {
    app.log.debug(`[auth-service]: Attempting client verification for origin: ${info.origin}, secure: ${info.secure}`);
      // if (!info.secure) {
      //   app.log.warn('[auth-service]: Connection rejected - Only secure (WSS) connections are allowed.');
      //   return false;
      // }

      // const expectedOrigins = [
      //   'https://localhost:3000',
      //   'http://localhost:3000',
      //   'https://production-frontend.com'
      // ];
      // if (!expectedOrigins.includes(info.origin)) {
      //   app.log.warn(`[auth-service]: Connection rejected - Forbidden Origin: ${info.origin}`);
      //   return false;
      // }

    const cookieHeader = info.req.headers['cookie'];
    if (!cookieHeader) {
      app.log.info('[auth-service]: Connection rejected - No cookie header provided.');
      return false;
    }

    try {
      const parsedCookie = cookie.parse(cookieHeader);
      const token = parsedCookie['token'] as string;

      // if (!token) {
      //   app.log.warn('[auth-service]: Connection rejected: No token provided');
      //   return false;
      // }

      const user = await validateUser(token) as User;
      if (!user) {
        app.log.info('[auth-service]: Connection rejected: Invalid token or expired authentication credentials.');
        return false;
      }

      (info.req.socket as any)._user = user;

      return true;
    } catch (error) {
      app.log.error('Error verifying client:', error);
      return false;
    }
  };

  return {
    verifyClient,
    validateUser
  }
}

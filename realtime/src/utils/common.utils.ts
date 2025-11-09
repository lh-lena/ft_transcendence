import type { IncomingMessage } from 'http';

export function getRemoteAddress(req: IncomingMessage): string {
  if (req.socket.remoteAddress !== undefined && req.socket.remoteAddress !== null) {
    return req.socket.remoteAddress;
  }
  if (req.headers['x-forwarded-for'] !== undefined && req.headers['x-forwarded-for'] !== null) {
    return String(req.headers['x-forwarded-for']);
  }

  return 'unknown';
}

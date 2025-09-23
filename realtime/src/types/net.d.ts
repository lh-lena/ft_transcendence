import type { User } from '../core/schemas/index.js';

declare module 'net' {
  interface Socket {
    _user?: User;
  }
}

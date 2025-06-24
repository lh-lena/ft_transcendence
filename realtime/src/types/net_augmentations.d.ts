import { Socket } from 'net';
import { User } from './pong.types.js';

declare module 'net' {
  interface Socket {
    _user?: User;
  }
}
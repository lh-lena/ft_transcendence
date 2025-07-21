import { Socket } from 'net';
import { User } from '../schemas/user.schema.js';

declare module 'net' {
  interface Socket {
    _user?: User;
  }
}
import { Socket } from 'net';
import { User } from './game.types';

declare module 'net' {
  interface Socket {
    _user?: User;
  }
}
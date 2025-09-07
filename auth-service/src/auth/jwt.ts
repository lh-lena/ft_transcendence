import jwt from 'jsonwebtoken';
import type { TokenPayloadType } from '../schemas/jwt';
import { config } from '../config';

export function generateJWT(payload: TokenPayloadType) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayloadType) {
  return jwt.sign(payload, config.refreshTokenSecret, { expiresIn: '7d' });
}

export function verifyJWT(token: string, secret: string) {
  return jwt.verify(token, secret) as TokenPayloadType;
}

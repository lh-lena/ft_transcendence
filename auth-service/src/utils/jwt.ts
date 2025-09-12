//import jwt from 'jsonwebtoken';
//import type { TokenPayloadType } from '../schemas/jwt';
//import { config } from '../config';
import { apiClientBackend } from '../utils/apiClient';

//export function generateJWT(payload: TokenPayloadType) {
//  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' });
//}
//
//export function generateRefreshToken(payload: TokenPayloadType) {
//  return jwt.sign(payload, config.refreshTokenSecret, { expiresIn: '7d' });
//}
//
//export function verifyJWT(token: string, secret: string) {
//  return jwt.verify(token, secret) as TokenPayloadType;
//}

export async function isBlacklistedToken(token: string): Promise<boolean> {
  const res = await apiClientBackend.get('/auth/blacklist', { params: { token } });
  return res.data.blacklisted;
}

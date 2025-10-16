import argon2 from 'argon2';
import crypto from 'crypto';

const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 32768,
  timeCost: 3,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

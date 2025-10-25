import argon2 from 'argon2';
import crypto from 'crypto';

/**
 * Password Hashing Utilities
 *
 * Uses Argon2id, the winner of the Password Hashing Competition (2015).
 * Argon2id provides the best protection against both GPU and side-channel attacks.
 *
 * Security features:
 * - Argon2id algorithm (hybrid of Argon2i and Argon2d)
 * - 32 MiB memory cost (prevents GPU cracking)
 * - 3 iterations (time cost)
 * - Parallelism of 1 (sequential processing)
 * - Automatic salt generation (cryptographically secure)
 *
 */

const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 32768,
  timeCost: 3,
  parallelism: 1,
};

/**
 * Minimum password requirements
 * Enforces basic password security standards
 */
const minLen = 8;
const maxLen = 128;

/**
 * Hash a password using Argon2id
 *
 * Generates a secure, one-way hash of the password that can be safely stored
 * in the database. Each hash includes:
 * - Algorithm identifier ($argon2id$)
 * - Parameters (memory, time, parallelism)
 * - Random salt (16 bytes)
 * - Hash output (32 bytes by default)
 *
 * Example output:
 * $argon2id$v=19$m=32768,t=3,p=1$salthere$hashhere
 *
 * @param password - Plain text password to hash
 * @returns Promise<string> - Argon2 hash string (includes salt and parameters)
 * @throws {Error} If password doesn't meet requirements
 *
 * @example
 * const hash = await hashPassword('MySecurePassword123!');
 * // Store hash in database
 * await db.users.update({ passwordHash: hash });
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  if (password.length < minLen) {
    throw new Error(`Password must be at least ${minLen} characters`);
  }

  if (password.length > maxLen) {
    throw new Error(`Password must not exceed ${maxLen} characters`);
  }
  try {
    const hash = await argon2.hash(password, HASH_OPTIONS);
    return hash;
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against its hash
 *
 * @param hash - Stored Argon2 hash from database
 * @param password - Plain text password to verify
 * @returns Promise<boolean> - true if password matches, false otherwise
 * @throws {Error} If inputs are invalid
 *
 * @example
 * const isValid = await verifyPassword(storedHash, userInput);
 * if (isValid) {
 *   // Password correct, log user in
 * } else {
 *   // Password incorrect, reject login
 * }
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!hash || typeof hash !== 'string') {
    throw new Error('Hash must be a non-empty string');
  }

  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  console.log('Verifying password against hash:', hash);
  console.log('Password input', password);
  if (!hash.startsWith('$argon2')) {
    throw new Error('Invalid hash format (not an Argon2 hash)');
  }

  try {
    const isValid = await argon2.verify(hash, password);
    return isValid;
  } catch (error) {
    return false;
  }
}

/**
 * Generate SHA-256 hash of input string
 *
 * Used for hashing non-password data like:
 * - Backup codes (2FA recovery codes)
 *
 * @param input - String to hash
 * @returns Hexadecimal SHA-256 hash (64 characters)
 *
 * @example
 * // Hash a backup code for storage
 * const backupCode = '1234-5678-90ab-cdef';
 * const hashedCode = sha256(backupCode);
 * // Store hashedCode in database
 */
export function sha256(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

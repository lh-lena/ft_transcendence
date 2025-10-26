import { apiClientBackend } from './apiClient';
import { AxiosRequestConfig } from 'axios';
import { z } from 'zod';

/**
 * Token Blacklist Response Schema
 * Validates the structure of blacklist check responses
 */
const BlacklistResponseSchema = z.object({
  blacklisted: z.boolean(),
});

type BlacklistResponse = z.infer<typeof BlacklistResponseSchema>;

/**
 * Check if a token is blacklisted
 *
 * Queries the backend service to determine if a JWT token has been
 * revoked/blacklisted. Blacklisted tokens should not be accepted even
 * if they are otherwise valid.
 *
 * Common reasons for blacklisting:
 * - User logged out
 *
 * @param token - JWT token to check (access or refresh token)
 * @returns Promise<boolean> - true if token is blacklisted, false if valid
 * @throws {Error} If backend API call fails or response is invalid
 *
 * @example
 * const isBlacklisted = await isBlacklistedToken(userToken);
 * if (isBlacklisted) {
 *   return reply.status(401).send({ message: 'Token has been revoked' });
 * }
 */
export async function isBlacklistedToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token provided to blacklist check');
  }

  try {
    const config: AxiosRequestConfig = {
      method: 'GET',
      url: '/blacklist',
      params: { token },
    };

    const response = await apiClientBackend<BlacklistResponse>(config);

    const validationResult = BlacklistResponseSchema.safeParse(response);

    if (!validationResult.success) {
      return true;
    }

    const data = validationResult.data;

    return data.blacklisted;
  } catch (error) {
    return true;
  }
}

/**
 * Add a token to the blacklist
 *
 * Called when a user logs out or a token needs to be revoked.
 *
 * @param token - JWT token to blacklist
 * @returns Promise<void>
 * @throws {Error} If blacklisting fails
 *
 * @example
 * await blacklistToken(userToken, 'logout');
 */
export async function blacklistToken(token: string): Promise<void> {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token provided for blacklisting');
  }

  try {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: '/blacklist',
      data: {
        token,
      },
    };

    await apiClientBackend<void>(config);
  } catch (error) {
    throw new Error('Failed to blacklist token');
  }
}

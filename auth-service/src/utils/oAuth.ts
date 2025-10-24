import { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';
import { AxiosRequestConfig } from 'axios';
import { GithubUser } from '../schemas/github';

/**
 * Registers or logs in a user from GitHub OAuth
 * @param githubUser - GitHub user profile data
 * @returns User object or null if already logged in
 */
export async function regOrlogUser(server: FastifyInstance, githubUser: GithubUser) {
  const githubId = githubUser.githubId.toString();
  try {
    const user = await server.user.getUser({ githubId: githubId });

    server.log.info({ githubId, userId: user.userId }, 'Existing GitHub user found');

    if (user.online) {
      server.log.warn({ githubId, userId: user.userId }, 'User already logged in');
      return null;
    }

    return user;
  } catch {
    server.log.info({ githubId }, 'Creating new user from GitHub OAuth');

    let path;

    if (githubUser.avatar) {
      try {
        const config: AxiosRequestConfig = {
          method: 'post',
          url: `/upload/github`,
          data: {
            githubAvatarUrl: githubUser.avatar,
          },
        };

        const response = await server.api(config);

        if (response.success) {
          path = response.storedName;
          server.log.debug({ githubId, path }, 'GitHub avatar downloaded successfully');
        }
      } catch (avatarError) {
        server.log.warn(
          { err: avatarError, githubId },
          'Failed to download GitHub avatar, continuing with default',
        );
      }
    }

    const newUser = await server.user.post({
      ...githubUser,
      githubId: githubId,
      color: '#dff41a',
      colormap: 'neutral',
      avatar: path,
    });

    server.log.info({ userId: newUser.userId, githubId }, 'New user created from GitHub OAuth');

    return newUser;
  }
}

/**
 * Fetches user profile from GitHub API
 * @param accessToken - GitHub OAuth access token
 * @returns GitHub user profile data
 * @throws Error if GitHub API request fails
 */
export async function fetchGithubUser(server: FastifyInstance, accessToken: string) {
  server.log.debug('Fetching user profile from GitHub API');

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!userRes.ok) {
    const errorText = await userRes.text();
    server.log.error({ status: userRes.status, error: errorText }, 'GitHub API request failed');
    throw new Error(`GitHub API error: ${userRes.status}`);
  }
  const user = (await userRes.json()) as {
    login: string;
    avatar_url: string;
    id: number;
    email?: string;
  };

  server.log.debug({ githubId: user.id, username: user.login }, 'GitHub user profile fetched');

  return {
    username: user.login,
    avatar: user.avatar_url,
    githubId: user.id,
    guest: false,
    email: user.email,
  };
}

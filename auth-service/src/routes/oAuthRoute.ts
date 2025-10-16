/**
 * OAuth2 GitHub Integration Routes
 *
 * Handles GitHub OAuth authentication flow:
 * . User authorizes on GitHub
 * . GitHub redirects to /api/oauth/callback with auth code
 * . This service exchanges code for access token
 * . Fetches user profile from GitHub API
 * . Creates or logs in user
 * . Returns auth tokens via postMessage to opener window
 *
 * Features:
 * - Auto-registration for new GitHub users
 * - Avatar download and storage
 * - 2FA integration
 * - Popup window communication
 *
 * @module routes/oAuth2Route
 */ import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fetch from 'node-fetch';
import fp from 'fastify-plugin';
import { AxiosRequestConfig } from 'axios';

/**
 * GitHub user data structure
 */
interface GithubUser {
  username: string;
  avatar: string;
  githubId: number;
  guest: boolean;
}

const oAuth2Routes = async (server: FastifyInstance) => {
  /**
   * Registers or logs in a user from GitHub OAuth
   * @param githubUser - GitHub user profile data
   * @returns User object or null if already logged in
   */
  async function regOrlogUser(githubUser: GithubUser) {
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
  async function fetchGithubUser(accessToken: string) {
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

  /**
   * GET /api/oauth/callback
   * GitHub OAuth callback endpoint
   * Exchanges authorization code for access token and completes login
   *
   * Flow:
   * 1. Exchange code for GitHub access token
   * 2. Fetch user profile from GitHub
   * 3. Create or login user in our system
   * 4. Handle 2FA if enabled
   * 5. Send result to popup opener window
   * 6. Close popup window
   *
   * @public
   * @query code - Authorization code from GitHub
   * @query state - CSRF protection state parameter
   */
  server.get('/api/oauth/callback', async (req: FastifyRequest, reply: FastifyReply) => {
    const frontendUrl = await server.config.frontendUrl;

    try {
      server.log.info('Handling OAuth callback');

      const token = await server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

      server.log.debug('OAuth token received:');

      const githubUser = await fetchGithubUser(token.token.access_token);

      const user = await regOrlogUser(githubUser);

      if (user === null) {
        server.log.warn(
          { githubId: githubUser.githubId },
          'User already online, rejecting OAuth login',
        );

        return reply.type('text/html').send(
          generateOAuthResponseHTML(frontendUrl, {
            type: 'OAUTH_ERROR',
            error: 'User is already logged in from another session',
          }),
        );
      }

      if (user.tfaEnabled) {
        server.log.info({ userId: user.userId }, '2FA required for GitHub OAuth login');

        const tfaData = await server.tfa.handletfa(user);

        //    return reply.type('text/html').send(`
        //  <!DOCTYPE html>
        //  <html>
        //    <head><title>2FA Required</title></head>
        //    <body>
        //      <script>
        //        const data = ${JSON.stringify({
        //          type: '2FA_REQUIRED',
        //          sessionId: tfaData.sessionId,
        //          userId: tfaData.userId,
        //          tfaMethod: tfaData.tfaMethod,
        //          message: '2FA verification required',
        //        })};
        //
        //        try {
        //          if (window.opener) {
        //            window.opener.postMessage({
        //              type: 'OAUTH_RESULT',
        //              data: data
        //            }, '${frontendUrl}');
        //          }
        //          window.close();
        //        } catch (error) {
        //          console.error('Error communicating with parent window:', error);
        //          document.body.innerHTML = '<h1>2FA verification required. Please return to the main window.</h1>';
        //        }
        //      </script>
        //      <h1>2FA verification required. This window should close automatically.</h1>
        //    </body>
        //  </html>
        //  `);
        //  }
        return reply.type('text/html').send(
          generateOAuthResponseHTML(frontendUrl, {
            type: '2FA_REQUIRED',
            sessionId: tfaData.sessionId,
            userId: tfaData.userId,
            tfaMethod: tfaData.tfaMethod,
            message: '2FA verification required',
          }),
        );
      }

      reply = await reply.setAuthCookies(user.userId);

      const authData = reply.authData;

      if (!authData) {
        server.log.error({ userId: user.userId }, 'Failed to generate auth data');
        throw new Error('Authentication data missing');
      }

      server.log.info({ userId: user.userId }, 'GitHub OAuth login successful');

      //    return reply.type('text/html').send(`
      //  <!DOCTYPE html>
      //  <html>
      //    <head><title>OAuth Success</title></head>
      //    <body>
      //      <script>
      //        const data = ${JSON.stringify({
      //          type: 'OAUTH_SUCCESS',
      //          userId: user.userId,
      //          jwt: authData.jwt,
      //          message: 'Authentication successful',
      //        })};
      //
      //        try {
      //          if (window.opener) {
      //            window.opener.postMessage({
      //              type: 'OAUTH_RESULT',
      //              data: data
      //            }, '${frontendUrl}');
      //          }
      //          window.close();
      //        } catch (error) {
      //          console.error('Error communicating with parent window:', error);
      //          document.body.innerHTML = '<h1>Authentication successful! You can close this window.</h1>';
      //        }
      //      </script>
      //      <h1>Authentication successful! This window should close automatically.</h1>
      //    </body>
      //  </html>
      //  `);
      //  } catch {
      //    const frontendUrl = server.config.frontendUrl;

      //    return reply.type('text/html').send(`
      //  <!DOCTYPE html>
      //  <html>
      //    <head><title>OAuth Error</title></head>
      //    <body>
      //      <script>
      //        const data = ${JSON.stringify({
      //          type: 'OAUTH_ERROR',
      //          error: 'Authentication failed',
      //        })};
      //
      //        try {
      //          if (window.opener) {
      //            window.opener.postMessage({
      //              type: 'OAUTH_RESULT',
      //              data: data
      //            }, '${frontendUrl}');
      //          }
      //          window.close();
      //        } catch (error) {
      //          console.error('Error communicating with parent window:', error);
      //          document.body.innerHTML = '<h1>Authentication failed! You can close this window.</h1>';
      //        }
      //      </script>
      //      <h1>Authentication failed! You can close this window.</h1>
      //    </body>
      //  </html>
      //  `);
      //  }
      return reply.type('text/html').send(
        generateOAuthResponseHTML(frontendUrl, {
          type: 'OAUTH_SUCCESS',
          userId: user.userId,
          jwt: authData.jwt,
          message: 'Authentication successful',
        }),
      );
    } catch (error) {
      server.log.error({ err: error }, 'GitHub OAuth callback failed');

      return reply.type('text/html').send(
        generateOAuthResponseHTML(frontendUrl, {
          type: 'OAUTH_ERROR',
          error: error instanceof Error ? error.message : 'Authentication failed',
        }),
      );
    }
  });
};

/**
 * Generates HTML response for OAuth popup window
 * Uses postMessage API to communicate with parent window
 *
 * @param frontendUrl - Allowed origin for postMessage
 * @param data - Data to send to parent window
 * @returns HTML string with embedded script
 */
function generateOAuthResponseHTML(frontendUrl: string, data: Record<string, unknown>): string {
  const safeData = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  const messageMap = {
    OAUTH_SUCCESS: 'Authentication successful! This window will close automatically.',
    '2FA_REQUIRED': '2FA verification required. This window will close automatically.',
    OAUTH_ERROR: 'Authentication failed. This window will close automatically.',
  };

  let message: string;

  switch (data.type) {
    case 'OAUTH_SUCCESS':
      message = messageMap.OAUTH_SUCCESS;
      break;
    case '2FA_REQUIRED':
      message = messageMap['2FA_REQUIRED'];
      break;
    case 'OAUTH_ERROR':
      message = messageMap.OAUTH_ERROR;
      break;
    default:
      message = 'Processing...';
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>OAuth ${data.type}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .message {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="message">
          <h1>${message}</h1>
        </div>
        <script>
          (function() {
            const data = ${safeData};
            
            try {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({
                  type: 'OAUTH_RESULT',
                  data: data
                }, '${frontendUrl}');
                
                // Close window after a short delay to ensure message is received
                setTimeout(() => window.close(), 500);
              } else {
                console.error('Parent window not available');
              }
            } catch (error) {
              console.error('Error communicating with parent window:', error);
            }
          })();
        </script>
      </body>
    </html>
  `;
}

export default fp(oAuth2Routes, {
  name: 'oauth2-routes',
  dependencies: ['github-oauth', 'user-plugin', 'tfa-plugin'],
});

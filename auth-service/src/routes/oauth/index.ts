/**
 * OAuth2 GitHub Integration Routes
 *
 * @module routes/oAuth2Route
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fetchGithubUser, regOrlogUser } from '../../utils/oAuth';

const oAuth2Routes = async (server: FastifyInstance) => {
  /**
   * GET /api/oauth/callback
   * GitHub OAuth callback endpoint
   * Exchanges authorization code for access token and completes login
   *
   * @public
   * @query code - Authorization code from GitHub
   * @query state - CSRF protection state parameter
   */
  server.get('/callback', async (req: FastifyRequest, reply: FastifyReply) => {
    const frontendUrl = await server.config.FRONTEND_URL;

    try {
      server.log.info('Handling OAuth callback');

      const query = req.query as { code?: string; state?: string; error?: string };

      if (query.error) {
        server.log.warn({ error: query.error }, 'OAuth authorization denied by user');
        return reply.type('text/html').send(
          generateOAuthResponseHTML(frontendUrl, {
            type: 'OAUTH_ERROR',
            error: `Authorization denied: ${query.error}`,
          }),
        );
      }

      if (!query.code) {
        server.log.error('Missing authorization code in callback');
        return reply.type('text/html').send(
          generateOAuthResponseHTML(frontendUrl, {
            type: 'OAUTH_ERROR',
            error: 'Missing authorization code',
          }),
        );
      }

      const tokenResponse = await server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

      server.log.debug({ tokenResponse }, 'OAuth token response received');

      if (!tokenResponse.token) {
        const errorMsg = 'Token exchange failed';

        server.log.error('GitHub token exchange failed');

        return reply.type('text/html').send(
          generateOAuthResponseHTML(frontendUrl, {
            type: 'OAUTH_ERROR',
            error: `Authentication failed: ${errorMsg}`,
          }),
        );
      }

      if (!tokenResponse.token.access_token) {
        server.log.error('Access token missing from response');
        return reply.type('text/html').send(
          generateOAuthResponseHTML(frontendUrl, {
            type: 'OAUTH_ERROR',
            error: 'Invalid token response',
          }),
        );
      }

      const accessToken = tokenResponse.token.access_token;
      server.log.debug('Access token obtained successfully');

      const githubUser = await fetchGithubUser(server, accessToken);

      if (!githubUser) {
        server.log.error('Failed to fetch GitHub user profile');
        return reply.type('text/html').send(
          generateOAuthResponseHTML(frontendUrl, {
            type: 'OAUTH_ERROR',
            error: 'Failed to retrieve user profile',
          }),
        );
      }

      const user = await regOrlogUser(server, githubUser);

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

      server.log.debug({ userId: user.userId }, 'user oAuthenticated');

      reply = reply.setAuthCookies({ id: user.userId, role: 'user' });

      server.log.debug(reply, 'Auth cookies set successfully');

      const authData = reply.authData;

      server.log.debug(reply.authData, 'Auth OBJECT set successfully');

      if (!authData || !authData.jwt) {
        server.log.error({ userId: user.userId }, 'Failed to generate auth data');
        return reply.type('text/html').send(
          generateOAuthResponseHTML(frontendUrl, {
            type: 'OAUTH_ERROR',
            error: 'Authentication data generation failed',
          }),
        );
      }

      server.log.info({ userId: user.userId }, 'GitHub OAuth login successful');

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
  const safeData = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  const messageMap: Record<string, string> = {
    OAUTH_SUCCESS: 'Authentication successful! This window will close automatically.',
    '2FA_REQUIRED': '2FA verification required. This window will close automatically.',
    OAUTH_ERROR: 'Authentication failed. This window will close automatically.',
  };

  const message = messageMap[data.type as string] || 'Processing...';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
        <title>OAuth ${String(data.type).replace(/_/g, ' ')}</title>
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
            max-width: 400px;
          }
          .message h1 {
            font-size: 1.25rem;
            margin: 0;
            color: #333;
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
            const targetOrigin = '${frontendUrl}';
            
            try {
              if (!window.opener || window.opener.closed) {
                console.error('Parent window not available');
                document.querySelector('.message h1').textContent = 
                  'Please close this window and try again.';
                return;
              }

              window.opener.postMessage({
                source: 'oauth-callback',
                type: 'OAUTH_RESULT',
                data: data
              }, targetOrigin);
              
              console.log('OAuth result sent to parent window');
              
              setTimeout(() => {
                window.close();
                
                setTimeout(() => {
                  if (!window.closed) {
                    document.querySelector('.message h1').textContent = 
                      'Please close this window manually.';
                  }
                }, 100);
              }, 500);
              
            } catch (error) {
              console.error('Error communicating with parent window:', error);
              document.querySelector('.message h1').textContent = 
                'Error: Please close this window and try again.';
            }
          })();
        </script>
      </body>
    </html>
  `;
}

export default oAuth2Routes;

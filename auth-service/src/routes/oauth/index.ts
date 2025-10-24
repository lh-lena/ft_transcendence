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

      const token = await server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

      server.log.debug('OAuth token received:');

      const githubUser = await fetchGithubUser(server, token.token.access_token);

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

      reply = await reply.setAuthCookies({ id: user.userId, role: 'user' });

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

export default oAuth2Routes;

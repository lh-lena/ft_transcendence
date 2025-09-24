import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fetch from 'node-fetch';
import fp from 'fastify-plugin';

type GithubUser = {
  username: string;
  avatar: string;
  githubId: number;
  guest: boolean;
};

const oAuth2Routes = async (server: FastifyInstance) => {
  async function regOrlogUser(githubUser: GithubUser) {
    const githubId = githubUser.githubId.toString();
    try {
      const user = await server.user.getUser({ githubId: githubId });

      return user;
    } catch {
      const newUser = await server.user.post({
        ...githubUser,
        githubId: githubId,
        color: '#dff41a',
        colormap: 'neutral',
      });

      return newUser;
    }
  }

  async function fetchGithubUser(accessToken: string) {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const user = (await userRes.json()) as { login: string; avatar_url: string; id: number };

    return {
      username: user.login,
      avatar: user.avatar_url,
      githubId: user.id,
      guest: false,
    };
  }

  server.get('/api/oauth/callback', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = await server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
      const githubUser = await fetchGithubUser(token.token.access_token);
      const user = await regOrlogUser(githubUser);

      const frontendUrl = server.config.frontendUrl;

      if (user.tfaEnabled) {
        const tfaData = await server.tfa.handletfa(user);

        // Return HTML that sends data and closes window
        return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head><title>2FA Required</title></head>
        <body>
          <script>
            const data = ${JSON.stringify({
              type: '2FA_REQUIRED',
              sessionId: tfaData.sessionId,
              userId: tfaData.userId,
              tfaMethod: tfaData.tfaMethod,
              message: '2FA verification required',
            })};
            
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_RESULT',
                  data: data
                }, '${frontendUrl}');
              }
              window.close();
            } catch (error) {
              console.error('Error communicating with parent window:', error);
              document.body.innerHTML = '<h1>2FA verification required. Please return to the main window.</h1>';
            }
          </script>
          <h1>2FA verification required. This window should close automatically.</h1>
        </body>
      </html>
      `);
      }

      // For successful OAuth (no 2FA), set cookies and send success message
      const accessToken = server.generateAccessToken({ id: user.userId });
      const refreshToken = server.generateRefreshToken({ id: user.userId });

      reply.setAuthCookie('jwt', accessToken);
      reply.setAuthCookie('refreshToken', refreshToken, { path: '/api/refresh' });

      return reply.type('text/html').send(`
    <!DOCTYPE html>
    <html>
      <head><title>OAuth Success</title></head>
      <body>
        <script>
          const data = ${JSON.stringify({
            type: 'OAUTH_SUCCESS',
            userId: user.userId,
            message: 'Authentication successful',
          })};
          
          try {
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_RESULT',
                data: data
              }, '${frontendUrl}');
            }
            window.close();
          } catch (error) {
            console.error('Error communicating with parent window:', error);
            document.body.innerHTML = '<h1>Authentication successful! You can close this window.</h1>';
          }
        </script>
        <h1>Authentication successful! This window should close automatically.</h1>
      </body>
    </html>
    `);
    } catch (error: any) {
      console.error('OAuth callback error:', error);

      const frontendUrl = server.config.frontendUrl;

      return reply.type('text/html').send(`
    <!DOCTYPE html>
    <html>
      <head><title>OAuth Error</title></head>
      <body>
        <script>
          const data = ${JSON.stringify({
            type: 'OAUTH_ERROR',
            error: error.message || 'Authentication failed',
          })};
          
          try {
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_RESULT',
                data: data
              }, '${frontendUrl}');
            }
            window.close();
          } catch (error) {
            console.error('Error communicating with parent window:', error);
            document.body.innerHTML = '<h1>Authentication failed! You can close this window.</h1>';
          }
        </script>
        <h1>Authentication failed! You can close this window.</h1>
      </body>
    </html>
    `);
    }
  });

  //  server.get('/api/oauth/callback', async (req: FastifyRequest, reply: FastifyReply) => {
  //    try {
  //      const token = await server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
  //
  //      const githubUser = await fetchGithubUser(token.token.access_token);
  //
  //      const user = await regOrlogUser(githubUser);
  //
  //      if (user.tfaEnabled) {
  //        const tfaData = await server.tfa.handletfa(user);
  //        console.log(tfaData);
  //        return reply.code(200).send(tfaData);
  //      }
  //
  //      const accessToken = server.generateAccessToken({ id: user.userId });
  //      const refreshToken = server.generateRefreshToken({ id: user.userId });
  //
  //      reply.setAuthCookie('jwt', accessToken);
  //      reply.setAuthCookie('refreshToken', refreshToken, { path: '/api/refresh' });
  //
  //      return reply.code(200).send({
  //        type: 'OAUTH_SUCCESS',
  //        userId: user.userId,
  //        message: 'Authentication successful! You can close this window.',
  //      });
  //    } catch (error: any) {
  //      console.error('OAuth callback error:', error);
  //
  //      return reply.code(400).send({
  //        type: 'OAUTH_ERROR',
  //        message: error.messge || 'Authentication failed.',
  //      });
  //    }
  //  });
};
export default fp(oAuth2Routes);

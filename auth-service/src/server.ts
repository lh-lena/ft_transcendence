import Fastify from 'fastify';

const server = Fastify({ logger: true });

server.get('/api/auth/health', async (request, reply) => {
  return { 
    status: 'ok', 
    service: 'auth-service',
    message: 'Auth service running on port 8082'
  };
});

const start = async () => {
  try {
    await server.listen({ port: 8082, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
// backend/src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';

const server = Fastify({ logger: true });

server.register(cors, { origin: true });

// Basic health check endpoint
server.get('/api/health', async (request, reply) => {
  return { 
    status: 'ok', 
    service: 'backend',
    message: 'Fastify server running on port 8080'
  };
});

const start = async () => {
  try {
    await server.listen({ port: 8080, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
import { FastifyInstance } from 'fastify';
import * as client from 'prom-client';

export default async function requestMetricsHook(fastify: FastifyInstance) {
  // HTTP request duration histogram
  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    registers: [fastify.metrics.register],
  });

  // HTTP request counter
  const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [fastify.metrics.register],
  });

  fastify.addHook('onRequest', async (request) => {
    request.startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = (Date.now() - request.startTime) / 1000;
    const labels = {
      method: request.method,
      route: request.routeOptions?.url || request.url,
      status_code: reply.statusCode.toString(),
    };

    httpRequestDuration.observe(labels, responseTime);
    httpRequestsTotal.inc(labels);
  });
}

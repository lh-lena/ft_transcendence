/**
 * HTTP Proxy Plugin
 *
 * Proxies specific routes to the backend microservice.
 * Primarily used for file upload operations that require direct backend access.
 *
 * @module plugins/httpProxy
 */

import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyHttpProxy, { FastifyHttpProxyOptions } from '@fastify/http-proxy';

/**
 * Proxy plugin configuration options
 */
interface ProxyPluginOptions {
  routes?: ProxyRoute[];

  globalOptions?: {
    enableLogging?: boolean;
    enableRetry?: boolean;
  };
}

interface ProxyRoute {
  prefix: string;
  rewritePrefix?: string;
  timeout?: number;
  http2?: boolean;
  upstream?: string;
  options?: Partial<FastifyHttpProxyOptions>;
}

/**
 * Default proxy routes for common backend operations
 */
const DEFAULT_PROXY_ROUTES: ProxyRoute[] = [
  {
    prefix: '/api/upload',
    rewritePrefix: '/api/upload',
    http2: false,
    timeout: 60000,
  },
];

const httpProxyPlugin = async (server: FastifyInstance, options: ProxyPluginOptions) => {
  const isDevelopment = server.config.NODE_ENV === 'development';

  const routes = options.routes || DEFAULT_PROXY_ROUTES;

  const globalOptions = {
    enableLogging: options.globalOptions?.enableLogging ?? isDevelopment,
    enableRetry: options.globalOptions?.enableRetry ?? true,
  };

  for (const route of routes) {
    const upstream = route.upstream || server.config.BACKEND_URL;
    const rewritePrefix = route.rewritePrefix || route.prefix;

    const preHandler = async (request: FastifyRequest, _reply: FastifyReply) => {
      if (globalOptions.enableLogging) {
        request.log.info(
          {
            method: request.method,
            url: request.url,
            prefix: route.prefix,
            upstream,
            contentType: request.headers['content-type'],
            contentLength: request.headers['content-length'],
          },
          'Proxying request to backend',
        );
      }
    };

    const proxyOptions: FastifyHttpProxyOptions = {
      upstream,
      prefix: route.prefix,
      rewritePrefix,
      http2: route.http2 ?? false,

      preHandler,
      replyOptions: {},
    };

    await server.register(fastifyHttpProxy, proxyOptions);

    server.log.info(`HTTP proxy registered: ${route.prefix} → ${upstream}`);
  }
};

export default fp(httpProxyPlugin, {
  name: 'http-proxy',
  fastify: '5.x',
  dependencies: ['config'],
});

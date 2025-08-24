import { Plugin } from 'vite';

export function metricsPlugin(): Plugin {
  const startTime = Date.now();
  let requestCount = 0;

  return {
    name: 'metrics-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // count all requests
        requestCount++;

        if (req.url === '/metrics') {
          const uptime = (Date.now() - startTime) / 1000;

          // generate Prometheus format metrics
          const metrics = `# HELP frontend_up Frontend service status
# TYPE frontend_up gauge
frontend_up 1

# HELP frontend_uptime_seconds Frontend uptime in seconds
# TYPE frontend_uptime_seconds gauge
frontend_uptime_seconds ${uptime}

# HELP frontend_requests_total Total number of requests
# TYPE frontend_requests_total counter
frontend_requests_total ${requestCount}

# HELP frontend_build_info Frontend build information
# TYPE frontend_build_info gauge
frontend_build_info{version="1.0.0",service="frontend"} 1
`;

          res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
          res.end(metrics);
        } else {
          next();
        }
      });
    },
  };
}

import * as client from 'prom-client';

const register = new client.Registry();

// collect default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for realtime service
const wsConnectionsGauge = new client.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

const serviceHealthGauge = new client.Gauge({
  name: 'realtime_service_health',
  help: 'Realtime service health status (1 = up, 0 = down)',
  registers: [register],
});

// Set service as healthy by default
serviceHealthGauge.set(1);

export const metricsService = {
  register,
  wsConnectionsGauge,
  serviceHealthGauge,

  async getMetrics(): Promise<string> {
    return await register.metrics();
  },

  getContentType(): string {
    return register.contentType;
  },
};

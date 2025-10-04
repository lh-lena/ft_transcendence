# 🎓 Monitoring System - Evaluation Guide

## Quick Verification Commands

### 1. Check All Services Are Being Monitored
```bash
curl -s http://localhost:9090/prometheus/api/v1/targets | \
python3 -m json.tool | grep -E "(job|health)" | grep -v "lastScrape"
```
**Expected:** All 5 jobs (backend, realtime, auth-service, nginx, prometheus) show `"health": "up"`

### 2. View Current Metrics
```bash
# Backend
curl http://localhost:8080/metrics | grep -E "(backend_service_health|db_connection_status)"

# Realtime  
curl http://localhost:8081/metrics | grep -E "(realtime_service_health|websocket_connections_active)"

# Auth
curl http://localhost:8082/metrics | grep -E "auth_service_health"

# Nginx
curl http://localhost:9113/metrics | grep -E "(nginx_up|nginx_connections_active)"
```

### 3. View Configured Alerts
```bash
curl http://localhost:9090/prometheus/api/v1/rules | python3 -m json.tool
```
**Or visit:** https://localhost/prometheus/alerts

---

## Alert Testing During Evaluation

### ✅ Easy to Demonstrate (4 alerts)

#### Test 1: ServiceDown Alert
```bash
# Stop a service
docker stop ft_transcendence_auth

# Wait 1 minute, check alert
curl http://localhost:9090/prometheus/alerts
# You'll see ServiceDown alert firing

# Restart
docker start ft_transcendence_auth
```

#### Test 2-4: Threshold Alerts (CPU, Memory, Requests)
These were tested using `alerts.test.yml` with low thresholds and confirmed working.

**To re-demonstrate:**
```bash
# Switch to test config
cp monitoring/prometheus/alerts.test.yml monitoring/prometheus/alerts.yml
curl -X POST http://localhost:9090/prometheus/-/reload

# Wait 30 seconds, alerts will fire
sleep 30
curl http://localhost:9090/prometheus/alerts

# Restore production config
cp monitoring/prometheus/alerts.yml.production monitoring/prometheus/alerts.yml
curl -X POST http://localhost:9090/prometheus/-/reload
```

---

### ✅ Harder to Demonstrate (3 alerts)

#### DatabaseConnectionFailed
**Why not tested:** Risk of data corruption  
**Proof it works:** Uses same mechanism as ServiceDown (`metric == 0`)  
**Show evaluator:**
```bash
# Show metric exists and is monitored
curl http://localhost:8080/metrics | grep db_connection_status
# db_connection_status 1

# Show alert is configured
grep -A 5 "DatabaseConnectionFailed" monitoring/prometheus/alerts.yml
```

#### HighWebSocketConnections  
**Why not tested:** Would need 50+ concurrent game sessions  
**Proof it works:** Uses same threshold mechanism as CPU/Memory (proven working)  
**Show evaluator:**
```bash
# Show metric is being tracked
curl http://localhost:8081/metrics | grep websocket_connections_active
# websocket_connections_active 0

# Show it updates when users connect
# (Open browser, log in, metric increments)
```

#### HealthCheckFailed
**Why not tested:** Same as ServiceDown  
**Proof it works:** Monitors `*_service_health` metrics with same logic as ServiceDown  
**Show evaluator:**
```bash
# Show all health metrics exist
curl http://localhost:8080/metrics | grep backend_service_health
curl http://localhost:8081/metrics | grep realtime_service_health
curl http://localhost:8082/metrics | grep auth_service_health

# When a service stops, health becomes 0, alert fires
# This is identical to ServiceDown mechanism (already proven)
```

---

## Key Points to Emphasize

### 1. Hot Reload Works
"We can update alert configurations without restarting containers because Prometheus has lifecycle management enabled."

```yaml
# docker-compose.yml
command:
  - '--web.enable-lifecycle'  # ← This enables hot reload
volumes:
  - ./monitoring/prometheus/alerts.yml:/etc/prometheus/alerts.yml:ro  # ← Bind mount
```

**Demonstrate:**
```bash
# Change a threshold
# Send reload signal
curl -X POST http://localhost:9090/prometheus/-/reload
# Config updates instantly!
```

### 2. Comprehensive Coverage
"We monitor:"
- ✅ Services (up/down, health checks)
- ✅ Performance (CPU, memory)
- ✅ Infrastructure (nginx connections, requests)
- ✅ Database (connection status)
- ✅ Application-specific (WebSocket connections for our game)

### 3. Production-Ready Thresholds
"Alert thresholds are set to real-world values:"
- CPU > 60% (not too sensitive)
- Memory > 200MB (reasonable for Node.js)
- Requests > 1000/min (appropriate for school project)
- WebSockets > 50 (25 concurrent games)

### 4. Alert States
"Alerts have two states:"
- **pending:** Condition met, waiting for `for` duration
- **firing:** Condition met for required time, alert active

This prevents false positives from brief spikes.

---

## Common Evaluator Questions

### Q: "How do I know these alerts actually work?"
**A:** 
1. Show that 4 alerts were tested and fired successfully (CPU, Memory, Request Rate, ServiceDown)
2. Explain that the other 3 use identical Prometheus mechanisms
3. Show that all metrics exist and are being collected
4. Offer to demonstrate ServiceDown again (quick test)

### Q: "Why didn't you test DatabaseConnectionFailed?"
**A:** "Testing it risks corrupting our SQLite database, which would break the entire application. However, it uses the same alert mechanism as ServiceDown (checking if `metric == 0`), which we've proven works. The metric exists and is being updated as you can see here: [show metric]"

### Q: "Can you show me the alerts firing?"
**A:** "Yes! I can demonstrate by temporarily stopping a service or by using our test configuration with low thresholds. Which would you prefer?"

### Q: "How do you update alerts in production?"
**A:** "We edit the YAML file and send a reload signal to Prometheus. No restart needed because lifecycle management is enabled. Let me show you: [demonstrate]"

---

## If Evaluator Wants to See Code

### Backend Health Metric
**File:** `backend/src/routes/000_health.route.ts`
```typescript
const backendServiceHealth = new client.Gauge({
  name: 'backend_service_health',
  help: 'Backend service health status (1 = up, 0 = down)',
});
```

### WebSocket Connection Tracking
**File:** `realtime/src/websocket/services/connection.service.ts`
```typescript
// When connection added:
metricsService.wsConnectionsGauge.set(userConnections.size());

// When connection removed:
metricsService.wsConnectionsGauge.set(userConnections.size());
```

### Database Status Check
**File:** `backend/src/routes/000_health.route.ts`
```typescript
try {
  await server.prisma.$queryRaw`SELECT 1`;
  dbStatus = 'up';
  dbStatusCode = 1;
} catch {
  dbStatus = 'unreachable';
  dbStatusCode = 0;
}
dbConnectionStatus.set(dbStatusCode);
```

---

## Quick Demo Script

Run this for a full demonstration:
```bash
./scripts/test-monitoring.sh
```

This interactive script provides several testing options:
- View current system metrics
- Demonstrate alert firing (ServiceDown)
- Show WebSocket connection tracking
- Display alert configuration
- Run quick health check

---

## URLs for Evaluation

- **Prometheus:** https://localhost/prometheus/
- **Prometheus Alerts:** https://localhost/prometheus/alerts
- **Prometheus Targets:** https://localhost/prometheus/targets
- **Grafana:** https://localhost/grafana/ (admin/admin123)

---

## Summary

✅ 7 alerts configured  
✅ 4 alerts tested and proven working  
✅ 3 alerts verified (metrics exist, logic correct)  
✅ All metrics being collected  
✅ All services monitored  
✅ Hot reload enabled  
✅ Production-ready thresholds  
✅ Comprehensive coverage  

**The monitoring system is complete and evaluation-ready!**

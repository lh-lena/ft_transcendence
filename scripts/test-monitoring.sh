#!/bin/bash
# Monitoring System Testing Script
# Usage: ./scripts/test-monitoring.sh [option]
#
# This script helps demonstrate and verify the Prometheus monitoring setup

set -e

show_alerts() {
    echo "Current active alerts:"
    curl -s http://localhost:9090/prometheus/api/v1/alerts | \
    python3 -c "
import sys, json
try:
    alerts = json.load(sys.stdin)['data']['alerts']
    if len(alerts) == 0:
        print('  No alerts firing (system healthy)')
    else:
        print(f'  Total: {len(alerts)}')
        firing = [a for a in alerts if a['state'] == 'firing']
        if firing:
            print(f'  Firing: {len(firing)}')
            for a in firing:
                job = a['labels'].get('job', 'N/A')
                print(f'    - {a[\"labels\"][\"alertname\"]} ({job})')
except:
    print('  Unable to fetch alerts')
" 2>/dev/null
    echo ""
}

show_menu() {
    clear
    echo "=========================================="
    echo "  Monitoring System Testing Menu"
    echo "=========================================="
    echo ""
    echo "Available tests:"
    echo ""
    echo "  1. Show current system metrics"
    echo "  2. Test ServiceDown alert"
    echo "  3. Show WebSocket tracking"
    echo "  4. View alert configuration"
    echo "  5. Run quick health check"
    echo "  0. Exit"
    echo ""
}

test_metrics() {
    echo ""
    echo "Current System Metrics"
    echo "======================"
    echo ""
    
    echo "Service Health Status:"
    backend_health=$(curl -s http://localhost:8080/api/metrics | grep '^backend_service_health' | awk '{print $2}')
    realtime_health=$(curl -s http://localhost:8081/metrics | grep '^realtime_service_health' | awk '{print $2}')
    auth_health=$(curl -s http://localhost:8082/api/metrics | grep '^auth_service_health' | awk '{print $2}')
    
    echo "  Backend:  ${backend_health:-unavailable}"
    echo "  Realtime: ${realtime_health:-unavailable}"
    echo "  Auth:     ${auth_health:-unavailable}"
    echo ""
    
    echo "Database:"
    db_status=$(curl -s http://localhost:8080/api/metrics | grep '^db_connection_status' | awk '{print $2}')
    echo "  Connection: ${db_status:-unavailable}"
    echo ""
    
    echo "WebSocket Connections:"
    ws_conn=$(curl -s http://localhost:8081/metrics | grep '^websocket_connections_active' | awk '{print $2}')
    echo "  Active: ${ws_conn:-0}"
    echo ""
    
    echo "Infrastructure (Nginx):"
    nginx_conn=$(curl -s http://localhost:9113/metrics | grep '^nginx_connections_active' | awk '{print $2}')
    nginx_req=$(curl -s http://localhost:9113/metrics | grep '^nginx_http_requests_total' | awk '{print $2}')
    echo "  Active Connections: ${nginx_conn:-unavailable}"
    echo "  Total Requests: ${nginx_req:-unavailable}"
    echo ""
    
    show_alerts
}

test_service_down() {
    echo ""
    echo "ServiceDown Alert Test"
    echo "======================"
    echo ""
    echo "This test demonstrates:"
    echo "  - Prometheus detects when a service stops responding"
    echo "  - Alert fires within the configured time window"
    echo "  - Same mechanism is used by HealthCheckFailed alert"
    echo ""
    
    read -p "Press Enter to stop the auth service..."
    echo "Stopping auth service..."
    docker stop ft_transcendence_auth >/dev/null 2>&1
    echo "Service stopped."
    echo ""
    
    echo "Waiting 30 seconds for Prometheus to detect..."
    sleep 30
    show_alerts
    
    echo "Waiting another 15 seconds for alert to transition to firing..."
    sleep 15
    show_alerts
    
    echo ""
    read -p "Press Enter to restart the service..."
    echo "Restarting auth service..."
    docker start ft_transcendence_auth >/dev/null 2>&1
    echo "Service restarted."
    echo ""
    echo "The alert will clear automatically once the service is healthy again."
    echo ""
}

test_websocket() {
    echo ""
    echo "WebSocket Connection Tracking"
    echo "=============================="
    echo ""
    echo "The HighWebSocketConnections alert monitors the number of active"
    echo "WebSocket connections. It fires when connections exceed 50."
    echo ""
    echo "Current value:"
    curl -s http://localhost:8081/metrics | grep '^websocket_connections_active'
    echo ""
    echo "This metric updates automatically when users connect or disconnect."
    echo ""
    echo "To see it in action:"
    echo "  1. Open the website in multiple browser tabs"
    echo "  2. Log in and start playing games"
    echo "  3. Watch the metric increment with each connection"
    echo ""
    
    read -p "Monitor in real-time? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Press Ctrl+C to stop monitoring..."
        sleep 1
        watch -n 2 'curl -s http://localhost:8081/metrics | grep "^websocket_connections_active"'
    fi
}

show_config() {
    echo ""
    echo "Alert Configuration"
    echo "==================="
    echo ""
    echo "Configured alerts:"
    curl -s http://localhost:9090/prometheus/api/v1/rules 2>/dev/null | \
    python3 -c "
import sys, json
try:
    rules = json.load(sys.stdin)['data']['groups'][0]['rules']
    for r in rules:
        print(f'  - {r[\"name\"]}')
except:
    print('  Unable to fetch rules')
" 2>/dev/null
    echo ""
    echo "Configuration file: monitoring/prometheus/alerts.yml"
    echo "Web interface: https://localhost/prometheus/alerts"
    echo ""
}

quick_check() {
    echo ""
    echo "Quick Health Check"
    echo "=================="
    echo ""
    
    echo "Checking Prometheus targets..."
    targets=$(curl -s http://localhost:9090/prometheus/api/v1/targets 2>/dev/null | \
    python3 -c "
import sys, json
try:
    targets = json.load(sys.stdin)['data']['activeTargets']
    up = len([t for t in targets if t['health'] == 'up'])
    total = len(targets)
    print(f'{up}/{total} targets healthy')
    for t in targets:
        job = t['labels']['job']
        health = t['health']
        status = 'OK' if health == 'up' else 'DOWN'
        print(f'  {job}: {status}')
except:
    print('Unable to check targets')
" 2>/dev/null)
    echo "$targets"
    echo ""
    
    show_alerts
}

# Main script logic
if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        read -p "Select option [0-5]: " choice
        
        case $choice in
            1)
                test_metrics
                read -p "Press Enter to continue..."
                ;;
            2)
                test_service_down
                read -p "Press Enter to continue..."
                ;;
            3)
                test_websocket
                read -p "Press Enter to continue..."
                ;;
            4)
                show_config
                read -p "Press Enter to continue..."
                ;;
            5)
                quick_check
                read -p "Press Enter to continue..."
                ;;
            0)
                echo "Exiting..."
                exit 0
                ;;
            *)
                echo "Invalid option. Please try again."
                sleep 2
                ;;
        esac
    done
else
    # Command line mode
    case $1 in
        metrics|1)
            test_metrics
            ;;
        servicedown|2)
            test_service_down
            ;;
        websocket|3)
            test_websocket
            ;;
        config|4)
            show_config
            ;;
        check|5)
            quick_check
            ;;
        *)
            echo "Usage: $0 [metrics|servicedown|websocket|config|check]"
            echo "   or: $0  (for interactive menu)"
            exit 1
            ;;
    esac
fi

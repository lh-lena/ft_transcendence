#!/bin/bash
# test-ci-locally.sh

echo "Starting services..."
docker-compose up -d

echo "Waiting for frontend to be ready..."
for i in {1..60}; do
  if curl -f http://localhost:3000 2>/dev/null; then
    echo "Frontend is ready!"
    break
  fi
  echo "Attempt $i/60: Frontend not ready yet..."
  if [ $i -eq 30 ]; then
    echo "=== Frontend logs at 30 seconds ==="
    docker logs ft_transcendence_frontend
  fi
  sleep 2
done

echo "Testing through nginx..."
curl -f http://localhost || {
  echo "Failed! Checking logs..."
  docker logs ft_transcendence_nginx
  docker logs ft_transcendence_frontend
  exit 1
}

docker-compose down
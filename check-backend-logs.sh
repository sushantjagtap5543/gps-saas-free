#!/bin/bash

echo "=== Checking Backend Container Logs ==="
echo ""

# Check if backend container exists
if docker ps -a | grep -q gps_backend; then
    echo "Backend container found. Checking logs..."
    echo ""
    docker logs gps_backend 2>&1 | tail -50
else
    echo "Backend container not found!"
fi

echo ""
echo "=== Checking All Container Status ==="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Checking Database Connection ==="
docker exec gps_postgres pg_isready -U gpsadmin 2>&1

echo ""
echo "=== Checking Redis ==="
docker exec gps_redis redis-cli ping 2>&1

#!/usr/bin/env bash
set -e

echo "=== Verifying StructShield Infrastructure Containers ==="

services=("postgres" "redis" "kafka")
all_healthy=true

for svc in "${services[@]}"; do
    container_name="structshield-$svc"
    status=$(docker inspect --format '{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "not_found")
    if [ "$status" = "healthy" ]; then
        echo -e "\033[0;32m[OK]\033[0m $container_name is HEALTHY"
    else
        echo -e "\033[0;33m[WARN]\033[0m $container_name status is '$status'"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    echo -e "\033[0;32mAll infrastructure dependencies are healthy and ready.\033[0m"
else
    echo -e "\033[0;31mSome containers are still initializing or unhealthy. Run 'docker compose ps' to inspect.\033[0m"
fi

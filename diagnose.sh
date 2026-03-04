#!/bin/bash

# ============================================================================
# GPS-FREE-SAAS DIAGNOSTIC SCRIPT
# ============================================================================
# Collects system information for troubleshooting
# Usage: ./diagnose.sh
# ============================================================================

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="diagnostic_${TIMESTAMP}.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   GPS-FREE-SAAS DIAGNOSTIC TOOL                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo "Collecting diagnostic information..."
echo "Output will be saved to: $OUTPUT_FILE"
echo ""

# Start output
{
    echo "GPS-FREE-SAAS DIAGNOSTIC REPORT"
    echo "Generated: $(date)"
    echo "=========================================="
    echo ""

    # System Information
    echo "=== SYSTEM INFORMATION ==="
    echo "Hostname: $(hostname)"
    echo "Kernel: $(uname -r)"
    echo "Architecture: $(uname -m)"
    echo ""
    
    if [ -f /etc/os-release ]; then
        cat /etc/os-release
    fi
    echo ""

    # Memory
    echo "=== MEMORY ==="
    free -h
    echo ""

    # Disk Space
    echo "=== DISK SPACE ==="
    df -h
    echo ""

    # Docker Version
    echo "=== DOCKER VERSION ==="
    if command -v docker &> /dev/null; then
        docker version 2>&1 || echo "Error getting Docker version"
        echo ""
        echo "Docker API Version:"
        docker version --format '{{.Client.APIVersion}}' 2>&1 || echo "Cannot determine API version"
    else
        echo "Docker not installed"
    fi
    echo ""

    # Docker Compose Version
    echo "=== DOCKER COMPOSE VERSION ==="
    if command -v docker compose &> /dev/null; then
        docker compose version 2>&1 || echo "Error getting Docker Compose version"
    elif command -v docker-compose &> /dev/null; then
        docker-compose version 2>&1 || echo "Error getting docker-compose version"
    else
        echo "Docker Compose not installed"
    fi
    echo ""

    # Environment Check
    echo "=== ENVIRONMENT CONFIGURATION ==="
    if [ -f .env ]; then
        echo "✓ .env file exists"
        echo "Size: $(wc -c < .env) bytes"
        echo ""
        echo "Environment variables (sensitive values hidden):"
        cat .env | grep -v "^#" | grep -v "^$" | sed 's/=.*/=***HIDDEN***/' 2>&1
    else
        echo "✗ .env file NOT found"
    fi
    echo ""

    # Docker Compose Config
    echo "=== DOCKER COMPOSE CONFIGURATION ==="
    if [ -f docker-compose.prod.yml ]; then
        echo "✓ docker-compose.prod.yml exists"
        docker compose -f docker-compose.prod.yml config --quiet 2>&1 || \
            echo "Error: Invalid docker-compose.prod.yml configuration"
    else
        echo "✗ docker-compose.prod.yml NOT found"
    fi
    echo ""

    # Container Status
    echo "=== CONTAINER STATUS ==="
    if command -v docker &> /dev/null; then
        docker compose -f docker-compose.prod.yml ps 2>&1 || \
            echo "Cannot get container status (services may not be running)"
        echo ""
        echo "All Docker containers:"
        docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>&1
    else
        echo "Docker not available"
    fi
    echo ""

    # Network Ports
    echo "=== NETWORK PORTS ==="
    echo "Listening ports:"
    sudo netstat -tlnp 2>/dev/null | grep -E 'LISTEN.*(3000|3001|5000|5001|5002|5432|6379)' || \
        ss -tlnp 2>/dev/null | grep -E '(3000|3001|5000|5001|5002|5432|6379)' || \
        echo "Cannot determine open ports"
    echo ""

    # Docker Networks
    echo "=== DOCKER NETWORKS ==="
    if command -v docker &> /dev/null; then
        docker network ls 2>&1
        echo ""
        docker network inspect gps-network 2>&1 | head -30 || \
            echo "gps-network not found"
    fi
    echo ""

    # Docker Volumes
    echo "=== DOCKER VOLUMES ==="
    if command -v docker &> /dev/null; then
        docker volume ls 2>&1
    fi
    echo ""

    # Docker Disk Usage
    echo "=== DOCKER DISK USAGE ==="
    if command -v docker &> /dev/null; then
        docker system df 2>&1
    fi
    echo ""

    # Service Health Checks
    echo "=== SERVICE HEALTH CHECKS ==="
    
    echo "Backend API Health:"
    curl -sf http://localhost:3001/health 2>&1 || echo "Backend not responding"
    echo ""
    
    echo "Frontend Health:"
    curl -sI http://localhost:3000 2>&1 | head -5 || echo "Frontend not responding"
    echo ""
    
    echo "Database Health:"
    if command -v docker &> /dev/null; then
        docker exec gps_postgres pg_isready -U gpsadmin 2>&1 || \
            echo "Database not responding or container not running"
    fi
    echo ""
    
    echo "Redis Health:"
    if command -v docker &> /dev/null; then
        docker exec gps_redis redis-cli ping 2>&1 || \
            echo "Redis not responding or container not running"
    fi
    echo ""

    # Recent Logs
    echo "=== RECENT CONTAINER LOGS (Last 50 lines) ==="
    if command -v docker &> /dev/null && [ -f docker-compose.prod.yml ]; then
        docker compose -f docker-compose.prod.yml logs --tail=50 2>&1 || \
            echo "Cannot retrieve logs"
    else
        echo "Docker or docker-compose.prod.yml not available"
    fi
    echo ""

    # File Permissions
    echo "=== FILE PERMISSIONS ==="
    ls -la . | head -20
    echo ""

    # Process Information
    echo "=== RUNNING PROCESSES ==="
    ps aux | grep -E 'docker|node|postgres|redis|nginx' | grep -v grep || \
        echo "No relevant processes found"
    echo ""

    # Firewall Status
    echo "=== FIREWALL STATUS ==="
    if command -v ufw &> /dev/null; then
        sudo ufw status 2>&1
    else
        echo "UFW not installed"
    fi
    echo ""

    # End of report
    echo "=========================================="
    echo "End of diagnostic report"
    echo "Generated: $(date)"

} > "$OUTPUT_FILE" 2>&1

echo -e "${GREEN}✓ Diagnostic complete!${NC}"
echo ""
echo "Report saved to: ${YELLOW}$OUTPUT_FILE${NC}"
echo ""
echo "To view the report:"
echo "  cat $OUTPUT_FILE"
echo ""
echo "To share for support:"
echo "  1. Review the file and remove any sensitive information"
echo "  2. Share $OUTPUT_FILE with support team"
echo ""

# Quick summary
echo -e "${BLUE}=== QUICK SUMMARY ===${NC}"

# Check critical components
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker installed${NC}"
    API_VERSION=$(docker version --format '{{.Client.APIVersion}}' 2>/dev/null)
    if [[ "${API_VERSION}" < "1.44" ]]; then
        echo -e "${RED}✗ Docker API version too old: ${API_VERSION}${NC}"
    else
        echo -e "${GREEN}✓ Docker API version OK: ${API_VERSION}${NC}"
    fi
else
    echo -e "${RED}✗ Docker NOT installed${NC}"
fi

if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${RED}✗ .env file missing${NC}"
fi

if [ -f docker-compose.prod.yml ]; then
    echo -e "${GREEN}✓ docker-compose.prod.yml exists${NC}"
else
    echo -e "${RED}✗ docker-compose.prod.yml missing${NC}"
fi

if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API responding${NC}"
else
    echo -e "${RED}✗ Backend API not responding${NC}"
fi

echo ""
echo "For detailed information, see: $OUTPUT_FILE"

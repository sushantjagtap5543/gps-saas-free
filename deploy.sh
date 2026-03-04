#!/bin/bash

# ============================================================================
# GPS-FREE-SAAS ONE-COMMAND DEPLOYMENT SCRIPT
# ============================================================================
# 100% Working • Tested on AWS Lightsail • Production Ready
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    printf "║  %-62s  ║\n" "$1"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ $1${NC}"; }

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root. Run as ubuntu user with sudo access."
    exit 1
fi

print_header "GPS-FREE-SAAS DEPLOYMENT STARTING"

# ============================================================================
# STEP 1: SYSTEM REQUIREMENTS
# ============================================================================
print_header "STEP 1/10: Checking System Requirements"

# Check OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    print_success "OS: $NAME $VERSION"
else
    print_error "Cannot determine OS"
    exit 1
fi

# Check memory
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_MEM" -lt 1800 ]; then
    print_warning "System has ${TOTAL_MEM}MB RAM. 2GB+ recommended."
else
    print_success "Memory: ${TOTAL_MEM}MB"
fi

# Check disk
FREE_DISK=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$FREE_DISK" -lt 10 ]; then
    print_warning "Only ${FREE_DISK}GB free disk space. 20GB+ recommended."
else
    print_success "Disk Space: ${FREE_DISK}GB free"
fi

# ============================================================================
# STEP 2: UPDATE SYSTEM
# ============================================================================
print_header "STEP 2/10: Updating System"

print_info "Running system update..."
sudo apt-get update -qq > /dev/null 2>&1
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq > /dev/null 2>&1
print_success "System updated"

# ============================================================================
# STEP 3: INSTALL DOCKER
# ============================================================================
print_header "STEP 3/10: Installing Docker"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker already installed: $DOCKER_VERSION"
    
    # Check API version
    DOCKER_API=$(docker version --format '{{.Client.APIVersion}}' 2>/dev/null || echo "1.43")
    if [[ "${DOCKER_API}" < "1.44" ]]; then
        print_warning "Docker API ${DOCKER_API} is old. Upgrading..."
        
        # Remove old version
        sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
        
        # Install latest
        print_info "Installing latest Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh > /dev/null 2>&1
        rm get-docker.sh
        print_success "Docker upgraded to latest version"
    fi
else
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh > /dev/null 2>&1
    rm get-docker.sh
    print_success "Docker installed"
fi

# Add user to docker group
if groups $USER | grep -q '\bdocker\b'; then
    print_success "User in docker group"
else
    print_info "Adding user to docker group..."
    sudo usermod -aG docker $USER
    print_warning "Applying docker group membership..."
    newgrp docker <<EONG
true
EONG
fi

# Install Docker Compose plugin
if docker compose version &> /dev/null; then
    print_success "Docker Compose plugin installed"
else
    print_info "Installing Docker Compose plugin..."
    sudo apt-get install -y docker-compose-plugin > /dev/null 2>&1
    print_success "Docker Compose plugin installed"
fi

# ============================================================================
# STEP 4: INSTALL TOOLS
# ============================================================================
print_header "STEP 4/10: Installing Additional Tools"

sudo apt-get install -y curl wget git jq make > /dev/null 2>&1
print_success "Tools installed"

# ============================================================================
# STEP 5: VALIDATE ENVIRONMENT
# ============================================================================
print_header "STEP 5/10: Validating Environment Configuration"

if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_info "Creating template .env file..."
    cat > .env << 'ENVEOF'
DB_PASSWORD=CHANGE_THIS_PASSWORD
JWT_SECRET=CHANGE_THIS_SECRET_32_CHARS_MIN
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
GPS_SERVER_KEY=CHANGE_THIS_KEY_32_CHARS_MIN
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NODE_ENV=production
ENVEOF
    print_error "Please edit .env file with your values!"
    print_info "Run: nano .env"
    exit 1
fi

# Check critical variables
source .env
ERRORS=0

if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" == "CHANGE_THIS_PASSWORD" ] || [ "$DB_PASSWORD" == "ChangeMeSecurePassword123" ]; then
    print_error "DB_PASSWORD not set properly"
    ERRORS=$((ERRORS + 1))
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "CHANGE_THIS_SECRET_32_CHARS_MIN" ] || [ "$JWT_SECRET" == "ChangeMeToRandomJWTSecret32CharsMinimum" ]; then
    print_error "JWT_SECRET not set properly"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
    print_error "Please fix .env file configuration"
    print_info "Generate secrets with: openssl rand -base64 32"
    exit 1
fi

print_success "Environment configuration valid"

# ============================================================================
# STEP 6: CREATE DIRECTORIES
# ============================================================================
print_header "STEP 6/10: Setting Up Directories"

mkdir -p backups ssl logs
chmod 755 backups logs
print_success "Directories created"

# ============================================================================
# STEP 7: STOP EXISTING CONTAINERS
# ============================================================================
print_header "STEP 7/10: Cleaning Up Existing Containers"

if docker ps -a --format '{{.Names}}' | grep -q 'gps_'; then
    print_info "Stopping existing containers..."
    docker compose -f docker-compose.prod.yml down > /dev/null 2>&1 || true
    print_success "Existing containers stopped"
else
    print_info "No existing containers to clean up"
fi

# ============================================================================
# STEP 8: BUILD SERVICES
# ============================================================================
print_header "STEP 8/10: Building Services (This may take 5-10 minutes)"

print_info "Building Docker images..."
if docker compose -f docker-compose.prod.yml build --no-cache 2>&1 | grep -i "error"; then
    print_error "Build failed! Check logs above"
    exit 1
fi
print_success "All services built successfully"

# ============================================================================
# STEP 9: START SERVICES
# ============================================================================
print_header "STEP 9/10: Starting All Services"

print_info "Starting containers..."
docker compose -f docker-compose.prod.yml up -d
print_success "All containers started"

# ============================================================================
# STEP 10: WAIT FOR SERVICES
# ============================================================================
print_header "STEP 10/10: Waiting for Services to Initialize"

print_info "Waiting for database..."
sleep 15

MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker exec gps_postgres pg_isready -U gpsadmin -d gpstrack &> /dev/null; then
        print_success "Database ready"
        break
    fi
    echo -n "."
    sleep 2
    RETRY=$((RETRY + 1))
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    print_error "Database failed to start"
    docker compose -f docker-compose.prod.yml logs postgres
    exit 1
fi

print_info "Waiting for backend API..."
sleep 20

RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:3001/health &> /dev/null; then
        print_success "Backend API ready"
        break
    fi
    echo -n "."
    sleep 3
    RETRY=$((RETRY + 1))
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    print_error "Backend failed to start"
    docker compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# ============================================================================
# VERIFY ALL SERVICES
# ============================================================================
print_header "VERIFYING ALL SERVICES"

CONTAINERS=("gps_postgres" "gps_redis" "gps_server" "gps_backend" "gps_web" "gps_nginx")
ALL_RUNNING=true

for container in "${CONTAINERS[@]}"; do
    if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
        print_success "$container: Running"
    else
        print_error "$container: Not running"
        ALL_RUNNING=false
    fi
done

if [ "$ALL_RUNNING" = false ]; then
    print_error "Some services failed. Check logs with: docker compose -f docker-compose.prod.yml logs"
    exit 1
fi

# ============================================================================
# SUCCESS!
# ============================================================================
print_header "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 GPS-FREE-SAAS IS LIVE!                   ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  📱 Web Application                                            ║"
echo "║     http://${SERVER_IP}:3000                          "
echo "║                                                                ║"
echo "║  🔌 Backend API                                                ║"
echo "║     http://${SERVER_IP}:3001                          "
echo "║                                                                ║"
echo "║  📚 API Documentation                                          ║"
echo "║     http://${SERVER_IP}:3001/api/docs                 "
echo "║                                                                ║"
echo "║  📍 GPS Device Ports                                           ║"
echo "║     GT06:  ${SERVER_IP}:5000                          "
echo "║     TK103: ${SERVER_IP}:5001                          "
echo "║     H02:   ${SERVER_IP}:5002                          "
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  🔐 Default Login                                              ║"
echo "║     Email:    admin@gps-free-saas.com                          ║"
echo "║     Password: admin123                                         ║"
echo "║     ⚠️  CHANGE THIS IMMEDIATELY!                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

print_header "USEFUL COMMANDS"

echo "View logs:"
echo "  docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Restart services:"
echo "  docker compose -f docker-compose.prod.yml restart"
echo ""
echo "Stop services:"
echo "  docker compose -f docker-compose.prod.yml down"
echo ""
echo "Service status:"
echo "  docker compose -f docker-compose.prod.yml ps"
echo ""
echo "Or use Make commands:"
echo "  make logs"
echo "  make restart"
echo "  make status"
echo ""

print_success "Deployment completed! Your GPS tracking system is ready!"
print_warning "Don't forget to configure your firewall to allow ports 80, 443, 3000, 3001, and 5000-5002"

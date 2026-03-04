#!/bin/bash

# ============================================================================
# GPS-FREE-SAAS DEPLOYMENT SCRIPT (FIXED VERSION)
# ============================================================================
# This script handles complete deployment with all known issues fixed
# Version: 2.0
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "============================================================================"
    echo "  $1"
    echo "============================================================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root. Run as ubuntu user."
    exit 1
fi

print_header "GPS-FREE-SAAS DEPLOYMENT - STARTING"

# ============================================================================
# STEP 1: SYSTEM REQUIREMENTS CHECK
# ============================================================================
print_header "STEP 1: Checking System Requirements"

# Check OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    print_success "OS: $NAME $VERSION"
else
    print_error "Cannot determine OS. This script is designed for Ubuntu 22.04"
    exit 1
fi

# Check memory
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_MEM" -lt 1800 ]; then
    print_warning "System has ${TOTAL_MEM}MB RAM. Minimum 2GB recommended."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "Memory: ${TOTAL_MEM}MB"
fi

# ============================================================================
# STEP 2: UPDATE SYSTEM
# ============================================================================
print_header "STEP 2: Updating System Packages"

print_warning "This may take a few minutes..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
print_success "System updated"

# ============================================================================
# STEP 3: INSTALL DOCKER (WITH VERSION FIX)
# ============================================================================
print_header "STEP 3: Installing Docker"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    print_success "Docker already installed: $DOCKER_VERSION"
    
    # Check if version is too old
    DOCKER_API_VERSION=$(docker version --format '{{.Client.APIVersion}}' 2>/dev/null || echo "1.43")
    if [[ "${DOCKER_API_VERSION}" < "1.44" ]]; then
        print_warning "Docker API version ${DOCKER_API_VERSION} is too old. Upgrading..."
        sudo apt-get remove -y docker docker-engine docker.io containerd runc || true
        
        # Fresh install
        print_warning "Installing latest Docker version..."
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg lsb-release
        
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
        print_success "Docker upgraded successfully"
    fi
else
    print_warning "Docker not found. Installing..."
    
    # Install prerequisites
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    print_success "Docker installed successfully"
fi

# Add user to docker group
if groups $USER | grep -q '\bdocker\b'; then
    print_success "User already in docker group"
else
    print_warning "Adding user to docker group..."
    sudo usermod -aG docker $USER
    print_warning "You may need to log out and back in for docker group to take effect"
    print_warning "Or run: newgrp docker"
fi

# Verify Docker Compose
if command -v docker compose &> /dev/null; then
    print_success "Docker Compose (plugin) installed"
elif command -v docker-compose &> /dev/null; then
    print_success "Docker Compose (standalone) installed"
else
    print_error "Docker Compose not found!"
    exit 1
fi

# ============================================================================
# STEP 4: INSTALL ADDITIONAL TOOLS
# ============================================================================
print_header "STEP 4: Installing Additional Tools"

sudo apt-get install -y git curl wget unzip make jq
print_success "Additional tools installed"

# ============================================================================
# STEP 5: CONFIGURE ENVIRONMENT
# ============================================================================
print_header "STEP 5: Configuring Environment"

if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_warning "Creating .env file from template..."
    
    cat > .env << 'ENVEOF'
# Database Configuration
DB_PASSWORD=PLEASE_CHANGE_THIS_PASSWORD
DATABASE_URL=postgresql://gpsadmin:${DB_PASSWORD}@postgres:5432/gpstrack

# JWT Secret
JWT_SECRET=PLEASE_GENERATE_A_SECURE_32_CHAR_SECRET

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# GPS Server Configuration
GPS_SERVER_KEY=PLEASE_CHANGE_THIS_GPS_SERVER_KEY

# Frontend URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Node Environment
NODE_ENV=production
ENVEOF
    
    print_error "CRITICAL: .env file created with default values"
    print_error "You MUST edit .env file with your actual values before proceeding!"
    print_warning "Run: nano .env"
    print_warning "Press Ctrl+X, then Y, then Enter to save"
    
    read -p "Press Enter after you've edited .env file..." -r
fi

# Validate critical env vars
source .env
MISSING_VARS=()

if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" == "PLEASE_CHANGE_THIS_PASSWORD" ]; then
    MISSING_VARS+=("DB_PASSWORD")
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "PLEASE_GENERATE_A_SECURE_32_CHAR_SECRET" ]; then
    MISSING_VARS+=("JWT_SECRET")
fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing or invalid environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    print_warning "Please edit .env file and set proper values"
    exit 1
fi

print_success "Environment configuration validated"

# ============================================================================
# STEP 6: SETUP PROJECT
# ============================================================================
print_header "STEP 6: Setting Up Project Structure"

# Create necessary directories
mkdir -p backups ssl logs
print_success "Directories created"

# Set permissions
chmod 755 backups logs
print_success "Permissions set"

# ============================================================================
# STEP 7: BUILD AND START SERVICES
# ============================================================================
print_header "STEP 7: Building and Starting Services"

print_warning "This may take 5-10 minutes for first build..."

# Stop any existing containers
if docker ps -q --filter "name=gps_" | grep -q .; then
    print_warning "Stopping existing containers..."
    docker compose -f docker-compose.prod.yml down
fi

# Build and start services
print_warning "Building images..."
docker compose -f docker-compose.prod.yml build --no-cache

print_warning "Starting services..."
docker compose -f docker-compose.prod.yml up -d

print_success "Services started"

# ============================================================================
# STEP 8: WAIT FOR SERVICES TO BE READY
# ============================================================================
print_header "STEP 8: Waiting for Services to Initialize"

echo "Waiting for database to be ready..."
sleep 10

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec gps_postgres pg_isready -U gpsadmin -d gpstrack &> /dev/null; then
        print_success "Database is ready"
        break
    fi
    echo -n "."
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Database failed to start"
    docker compose -f docker-compose.prod.yml logs postgres
    exit 1
fi

echo "Waiting for backend to be ready..."
sleep 15

RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:3001/health &> /dev/null; then
        print_success "Backend is ready"
        break
    fi
    echo -n "."
    sleep 3
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Backend failed to start"
    docker compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# ============================================================================
# STEP 9: VERIFY SERVICES
# ============================================================================
print_header "STEP 9: Verifying Services"

# Check all containers are running
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
    print_error "Some services failed to start. Check logs with:"
    echo "  docker compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Test API endpoint
if curl -sf http://localhost:3001/health | jq . &> /dev/null; then
    print_success "API health check passed"
else
    print_warning "API health check returned unexpected response"
fi

# ============================================================================
# STEP 10: DISPLAY ACCESS INFORMATION
# ============================================================================
print_header "DEPLOYMENT COMPLETED SUCCESSFULLY!"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || echo "localhost")

echo -e "${GREEN}"
echo "============================================================================"
echo "  🎉 GPS-FREE-SAAS IS NOW RUNNING!"
echo "============================================================================"
echo ""
echo "📱 Application URLs:"
echo "  Frontend:    http://${SERVER_IP}:3000"
echo "  API:         http://${SERVER_IP}:3001"
echo "  API Docs:    http://${SERVER_IP}:3001/api/docs"
echo "  Health:      http://${SERVER_IP}:3001/health"
echo ""
echo "🗺️ GPS Device Ports:"
echo "  GT06:        ${SERVER_IP}:5000"
echo "  TK103:       ${SERVER_IP}:5001"
echo "  H02:         ${SERVER_IP}:5002"
echo ""
echo "🔐 Default Admin Credentials:"
echo "  Email:       admin@gps-free-saas.com"
echo "  Password:    admin123"
echo "  ⚠️  CHANGE THIS IMMEDIATELY!"
echo ""
echo "============================================================================"
echo -e "${NC}"

# ============================================================================
# USEFUL COMMANDS
# ============================================================================
print_header "Useful Commands"

echo "View logs:"
echo "  docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Restart services:"
echo "  docker compose -f docker-compose.prod.yml restart"
echo ""
echo "Stop services:"
echo "  docker compose -f docker-compose.prod.yml down"
echo ""
echo "View service status:"
echo "  docker compose -f docker-compose.prod.yml ps"
echo ""
echo "Access database:"
echo "  docker exec -it gps_postgres psql -U gpsadmin -d gpstrack"
echo ""

print_success "Deployment script completed!"
print_warning "Remember to configure your firewall to allow necessary ports!"

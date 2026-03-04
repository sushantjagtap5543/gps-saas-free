# 🚀 GPS-FREE-SAAS PRODUCTION DEPLOYMENT GUIDE

**Version**: 1.0.0  
**Platform**: AWS Lightsail (Ubuntu 22.04 LTS, 2GB RAM)  
**Estimated Time**: 20-30 minutes  
**Difficulty**: Intermediate

---

## 📋 TABLE OF CONTENTS

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [AWS Lightsail Setup](#aws-lightsail-setup)
3. [System Preparation](#system-preparation)
4. [Docker Installation](#docker-installation)
5. [Application Deployment](#application-deployment)
6. [SSL/HTTPS Configuration](#ssl-https-configuration)
7. [Firewall Setup](#firewall-setup)
8. [Verification & Testing](#verification--testing)
9. [Post-Deployment](#post-deployment)
10. [Troubleshooting](#troubleshooting)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

Before you start, ensure you have:

- [ ] AWS Account with billing enabled
- [ ] Domain name (optional but recommended)
- [ ] Gmail account for SMTP (or other email service)
- [ ] SSH client (Windows: PuTTY, Mac/Linux: Terminal)
- [ ] Text editor for configuration
- [ ] Backup of any existing data

**Estimated Costs:**
- AWS Lightsail 2GB: $10/month
- Domain name: $12-15/year (optional)
- Total: ~$10/month (ZERO API costs, everything self-hosted!)

---

## 🛠️ AWS LIGHTSAIL SETUP

### Step 1: Create Lightsail Instance

1. **Log in to AWS Console**
   - Go to https://aws.amazon.com
   - Sign in to your account

2. **Navigate to Lightsail**
   - Search for "Lightsail" in the search bar
   - Click "Lightsail" to open

3. **Create Instance**
   - Click "Create instance"
   - Select: **Linux/Unix** platform
   - Select Blueprint: **Ubuntu 22.04 LTS**
   - Choose Plan: **2GB RAM, 1vCPU, 60GB SSD** ($10/month)

4. **Configure Instance**
   - Instance Name: `gps-tracking-server`
   - Region: Choose closest to your location
   - Availability Zone: Default is fine
   - Click "Create Instance"

5. **Wait for Startup**
   - Status changes from "Starting" to "Running" (usually 1-2 minutes)

### Step 2: Assign Static IP

1. **In Lightsail Console**
   - Click on your instance
   - Go to "Networking" tab
   - Scroll to "IPv4 Addresses"
   - Click "Create static IP"
   - Click "Attach" next to the created static IP
   - Note down your static IP (e.g., `1.2.3.4`)

### Step 3: Connect via SSH

#### On Mac/Linux:
```bash
# Make key readable (one-time setup)
chmod 400 ~/Downloads/LightsailDefaultPrivateKey.pem

# Connect to instance
ssh -i ~/Downloads/LightsailDefaultPrivateKey.pem ubuntu@YOUR_STATIC_IP
```

#### On Windows (Using PuTTY):
1. Download your `.pem` key from Lightsail Console
2. Convert `.pem` to `.ppk` using PuTTYgen
3. Open PuTTY
4. Host Name: `ubuntu@YOUR_STATIC_IP`
5. Connection > SSH > Auth > Select `.ppk` file
6. Click "Open"

---

## 🖥️ SYSTEM PREPARATION

Once connected to your instance:

### Step 1: Update System

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git nano vim

# Enable UFW firewall (we'll configure it later)
sudo ufw enable
```

### Step 2: Verify System Information

```bash
# Check OS
lsb_release -a

# Check disk space
df -h

# Check RAM
free -h

# Check CPU
nproc
```

Expected Output:
```
Ubuntu 22.04 LTS
Available: ~50GB
RAM: 1.9GB
CPU: 1 core
```

---

## 🐳 DOCKER INSTALLATION

### Step 1: Install Docker

```bash
# Download Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh

# Make it executable
sudo chmod +x get-docker.sh

# Run installation
sudo sh get-docker.sh

# Verify installation
docker --version
```

Expected Output:
```
Docker version 24.0.0+ (version may vary)
```

### Step 2: Configure Docker for Current User

```bash
# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Apply new group membership (refresh shell session)
newgrp docker

# Verify Docker without sudo
docker ps
```

### Step 3: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

Expected Output:
```
Docker Compose version v2.23.0 or higher
```

---

## 📦 APPLICATION DEPLOYMENT

### Step 1: Clone Repository

```bash
# Create application directory
mkdir -p ~/projects
cd ~/projects

# Clone GPS-SaaS repository
git clone https://github.com/sushantjagtap5543/gps-saas-free.git

# Navigate to project
cd gps-saas-free

# List contents
ls -la
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp infra/.env.example infra/.env

# Edit configuration (use your favorite editor)
nano infra/.env
```

### Step 3: Update .env File

Edit the following values in `infra/.env`:

```bash
# 1. DATABASE PASSWORD
# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)
# Output will be like: aB3xKj9nL2pQr5sT8uVwXyZa1bCdEfGhIjKlMnOpQr==
# Copy this value and paste it in .env
DB_PASSWORD=aB3xKj9nL2pQr5sT8uVwXyZa1bCdEfGhIjKlMnOpQr==

# 2. JWT SECRET (provided)
JWT_SECRET=2muz93QfGa25xG3T5C8nfOWW960T6jhIn8KYxv4aY7ojY2YJNgY83lh0jdCsnWC8

# 3. EMAIL CONFIGURATION
# Create Gmail app password:
# 1. Go to https://myaccount.google.com/apppasswords
# 2. Select "Mail" and "Windows Computer"
# 3. Copy the generated 16-character password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx

# 4. GPS SERVER KEY
# Generate secure key
GPS_SERVER_KEY=$(openssl rand -base64 32)
# Example: xY9kL5mN2bV7cD4fG1hJ8iK3lM0nOpQr5sT2uVwXyZaA==
GPS_SERVER_KEY=xY9kL5mN2bV7cD4fG1hJ8iK3lM0nOpQr5sT2uVwXyZaA==

# 5. FRONTEND URLs
# Replace YOUR_DOMAIN with your actual domain
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://yourdomain.com

# 6. DOMAIN
DOMAIN=yourdomain.com

# 7. ENVIRONMENT
NODE_ENV=production
```

**Save file**: Press Ctrl+O, Enter, Ctrl+X (in nano)

### Step 4: Verify Configuration

```bash
# Check if .env is properly formatted
cat infra/.env

# Verify all values are set (no placeholders)
grep "your\|YOUR\|change\|CHANGE" infra/.env
# Should return nothing if all values are set
```

### Step 5: Build Docker Images

```bash
# Navigate to project directory
cd ~/projects/gps-saas-free

# Build all services
docker-compose -f docker-compose.prod.yml build

# This will take 5-10 minutes (building Node.js, PostgreSQL images)
# Monitor build progress in terminal
```

### Step 6: Start Services

```bash
# Start all services in background
docker-compose -f docker-compose.prod.yml up -d

# Monitor startup progress
docker-compose logs -f
```

Expected logs:
```
gps_postgres_1  | CREATE DATABASE
gps_redis_1     | * Ready to accept connections
gps_server_1    | GPS Server listening on port 5000, 5001, 5002
gps_backend_1   | ✅ HTTP server running on 0.0.0.0:3001
gps_web_1       | ✅ Next.js server ready
gps_nginx_1     | Connection established
```

Press **Ctrl+C** to stop following logs.

### Step 7: Verify Services

```bash
# Check service status
docker-compose ps

# Expected output (all UP):
# NAME                 STATUS
# gps_postgres         Up 2 minutes
# gps_redis            Up 2 minutes
# gps_server           Up 1 minute
# gps_backend          Up 1 minute
# gps_web              Up 30 seconds
# gps_nginx            Up 15 seconds

# Test API health
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2024-03-04T...","uptime":...,"version":"1.0.0"}
```

---

## 🔒 SSL/HTTPS CONFIGURATION

### Option 1: Use Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com

# Certbot will save certificates at:
# /etc/letsencrypt/live/yourdomain.com/

# Copy certificates to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/projects/gps-saas-free/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/projects/gps-saas-free/ssl/

# Fix permissions
sudo chown ubuntu:ubuntu ~/projects/gps-saas-free/ssl/
chmod 600 ~/projects/gps-saas-free/ssl/*.pem
```

### Option 2: Self-Signed Certificate (For Testing)

```bash
# Generate self-signed certificate
cd ~/projects/gps-saas-free/ssl

sudo openssl req -x509 -newkey rsa:4096 -nodes \
  -out fullchain.pem -keyout privkey.pem -days 365 \
  -subj "/C=US/ST=State/L=City/O=Org/CN=yourdomain.com"

# Set permissions
sudo chmod 644 *.pem
sudo chown ubuntu:ubuntu *.pem
```

### Step 3: Update Nginx Configuration

```bash
# Edit Nginx config
nano infra/nginx.conf
```

Find the SSL section and ensure it points to:
```nginx
ssl_certificate /etc/nginx/ssl/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/privkey.pem;
```

### Step 4: Restart Services

```bash
# Reload Docker containers with new SSL certs
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Verify SSL
curl -I https://YOUR_STATIC_IP
# Should show: HTTP/2 200
```

---

## 🔥 FIREWALL SETUP

### AWS Lightsail Firewall Rules

1. **In AWS Lightsail Console:**
   - Click on your instance
   - Go to "Networking" tab
   - Scroll to "Firewall"
   - Add these rules:

| Application | Protocol | Port | Restrict |
|-------------|----------|------|----------|
| HTTP | TCP | 80 | No |
| HTTPS | TCP | 443 | No |
| SSH | TCP | 22 | Your IP only |
| Custom | TCP | 3000 | Your IP only |
| Custom | TCP | 3001 | Your IP only |
| Custom | TCP | 5000 | Device IPs only |
| Custom | TCP | 5001 | Device IPs only |
| Custom | TCP | 5002 | Device IPs only |

### System Firewall (UFW)

```bash
# Check firewall status
sudo ufw status

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow GPS device ports (from specific IPs if possible)
sudo ufw allow from 0.0.0.0/0 to any port 5000 proto tcp
sudo ufw allow from 0.0.0.0/0 to any port 5001 proto tcp
sudo ufw allow from 0.0.0.0/0 to any port 5002 proto tcp

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status numbered
```

---

## ✅ VERIFICATION & TESTING

### Test Frontend Access

```bash
# From your local computer:
curl -I https://YOUR_STATIC_IP
# or open in browser: https://YOUR_STATIC_IP

# Should see: HTTP/2 200
```

### Test API Health

```bash
# Test API
curl https://YOUR_STATIC_IP/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-03-04T...","uptime":...}
```

### Test API Documentation

```bash
# Open in browser: https://YOUR_STATIC_IP/api/docs
# Should see Swagger UI with all API endpoints
```

### Test GPS Server Connectivity

```bash
# From your local computer, test port connectivity
nc -zv YOUR_STATIC_IP 5000
# Output: Connection to YOUR_STATIC_IP port 5000 [tcp/onscreen] succeeded!

# Verify all GPS ports
nc -zv YOUR_STATIC_IP 5001
nc -zv YOUR_STATIC_IP 5002
```

### Test WebSocket Connection

```bash
# Using websocat (install: cargo install websocat)
websocat wss://YOUR_STATIC_IP/

# Or test with curl:
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://YOUR_STATIC_IP
```

---

## 🔐 POST-DEPLOYMENT

### Step 1: Change Default Credentials

**CRITICAL: Do this immediately!**

1. Open your browser: `https://YOUR_STATIC_IP`
2. Login with:
   - Email: `admin@gps.com`
   - Password: `admin123`
3. Go to Settings > Users
4. Change admin password to something strong
5. Delete demo user (`client@demo.com`)

### Step 2: Configure Email

Test email functionality:

1. Go to Settings > Email
2. Send test email to yourself
3. Verify delivery in inbox
4. Check spam folder if not received

### Step 3: Set Up GPS Devices

**Configure your GPS device to send data:**

```
Server IP: YOUR_STATIC_IP
Port: 5000 (for GT06) or 5001 (TK103) or 5002 (H02)
Protocol: Select based on device model
```

Example SMS command for GT06:
```
SERVER,0,YOUR_STATIC_IP,5000,0#
```

### Step 4: Enable Backups

```bash
# Create backup directory
mkdir -p ~/backups

# Set up automated daily backups (cron job)
crontab -e

# Add this line (backup at 2 AM daily):
0 2 * * * docker-compose -f ~/projects/gps-saas-free/docker-compose.prod.yml exec -T postgres pg_dump -U gpsadmin gpstrack > ~/backups/gpstrack-$(date +\%Y\%m\%d).sql
```

### Step 5: Set Up Monitoring

```bash
# Create log directory
mkdir -p ~/logs

# View service logs
docker-compose logs -f > ~/logs/gps-saas.log &

# Set up log rotation
sudo bash -c 'cat > /etc/logrotate.d/gps-saas << EOF
~/logs/gps-saas.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
}
EOF'
```

### Step 6: Document Your Setup

Create a deployment notes file:

```bash
cat > ~/DEPLOYMENT_NOTES.txt << EOF
GPS-SaaS-Free Deployment Information
=====================================

Deployment Date: $(date)
Domain: YOUR_DOMAIN
Static IP: YOUR_STATIC_IP
Region: YOUR_REGION

Services Status:
$(docker-compose ps)

Database Backup Command:
docker-compose -f ~/projects/gps-saas-free/docker-compose.prod.yml exec -T postgres pg_dump -U gpsadmin gpstrack > backup.sql

Service Status Check:
docker-compose -f ~/projects/gps-saas-free/docker-compose.prod.yml ps

View Logs:
docker-compose -f ~/projects/gps-saas-free/docker-compose.prod.yml logs -f

Admin Credentials: (Store securely, different from defaults!)
Email: YOUR_EMAIL
Password: YOUR_STRONG_PASSWORD
EOF
```

---

## 🐛 TROUBLESHOOTING

### Issue: Services not starting

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend

# Restart services
docker-compose down
docker-compose up -d

# Check system resources
free -h
df -h
docker stats
```

### Issue: Database connection failed

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U gpsadmin -d gpstrack -c "SELECT 1"

# Reset database (WARNING: deletes all data!)
docker-compose down -v
docker-compose up -d postgres
# Wait 10 seconds...
docker-compose up -d
```

### Issue: SSL certificate errors

```bash
# Check certificate validity
openssl x509 -in ~/projects/gps-saas-free/ssl/fullchain.pem -text -noout

# Renew Let's Encrypt (if applicable)
sudo certbot renew --dry-run

# Copy new cert
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/projects/gps-saas-free/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/projects/gps-saas-free/ssl/

# Restart services
docker-compose down
docker-compose up -d
```

### Issue: GPS data not arriving

```bash
# Check GPS server logs
docker-compose logs gps-server

# Test port connectivity from device
nc -ul 0.0.0.0 5000 &

# Test from another machine
nc -u YOUR_STATIC_IP 5000

# Verify firewall allows traffic
sudo ufw status
sudo iptables -L | grep 5000

# Check GPS server is listening
docker-compose exec gps-server netstat -tuln | grep 5000
```

### Issue: Out of disk space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old logs
docker-compose logs --tail 0 > /dev/null

# Compress old backups
gzip ~/backups/gpstrack-*.sql

# Free up space
rm -rf ~/.docker/buildx/*
```

### Issue: Memory issues

```bash
# Monitor memory usage
free -h
docker stats

# Check for memory leaks
docker-compose logs backend | grep -i memory

# Restart specific service
docker-compose restart backend

# Increase system swap
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📚 NEXT STEPS

After successful deployment:

1. **Set up monitoring**
   - Install Prometheus + Grafana
   - Set up alerts for service downtime

2. **Enable auto-scaling** (optional)
   - Use AWS Load Balancer
   - Deploy multiple instances

3. **Regular maintenance**
   - Weekly: Check backups
   - Monthly: Update dependencies
   - Quarterly: Security audit

4. **Optimize performance**
   - Monitor database queries
   - Set up Redis caching
   - Optimize Nginx configuration

---

## 📞 SUPPORT

If you encounter issues:

1. **Check logs first**
   ```bash
   docker-compose logs [service-name]
   ```

2. **Review documentation**
   - README.md in repository
   - FIXES_SUMMARY.md

3. **Contact support**
   - GitHub: https://github.com/sushantjagtap5543/gps-saas-free
   - Email: sushantjagtap5543@gmail.com

---

## 🎉 CONGRATULATIONS!

Your GPS-Free-SaaS application is now **LIVE** and ready to track vehicles!

**Summary:**
- ✅ Application deployed on AWS Lightsail
- ✅ SSL/HTTPS configured
- ✅ Firewall rules set
- ✅ Default credentials changed
- ✅ Database and backups configured
- ✅ GPS device ports open
- ✅ Ready for production use

**Total Cost**: ~$10/month (self-hosted, zero API fees)

---

**Deployment Date**: March 4, 2026  
**Status**: PRODUCTION READY ✅  
**Next Review**: Quarterly security audit

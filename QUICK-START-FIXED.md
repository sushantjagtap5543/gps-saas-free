# 🚀 GPS-FREE-SAAS QUICK START GUIDE (FIXED VERSION)

**Version**: 2.0 - All Known Issues Fixed  
**Deployment Time**: 10-15 minutes  
**Difficulty**: Beginner-Friendly

---

## 📦 WHAT'S BEEN FIXED

This package addresses all common deployment issues:

✅ **Docker Version Issue** - Upgraded to API version 1.44+  
✅ **Missing Environment Variables** - Complete .env template with validation  
✅ **Docker Compose Version** - Added version specification  
✅ **Service Dependencies** - Proper health checks and startup order  
✅ **Port Conflicts** - Clear port mapping and conflict resolution  
✅ **Build Failures** - Fixed Dockerfile configurations  
✅ **Database Connection** - Proper connection string and credentials  
✅ **Automated Deployment** - One-command deployment script

---

## 🎯 THREE WAYS TO DEPLOY

### Option 1: AUTOMATED DEPLOYMENT (Recommended for Beginners)

```bash
# 1. Upload the entire folder to your server
# 2. Navigate to the directory
cd gps-saas-deployment-fixed

# 3. Edit environment variables
nano .env
# Change ALL values marked with "PLEASE_CHANGE" or "your-"
# Press Ctrl+X, then Y, then Enter to save

# 4. Run deployment script
chmod +x deploy.sh
./deploy.sh
```

**That's it!** The script handles everything automatically.

---

### Option 2: MANUAL DEPLOYMENT (For Advanced Users)

```bash
# 1. System Update
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker (Latest Version)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 3. Install Docker Compose Plugin
sudo apt-get install docker-compose-plugin

# 4. Navigate to project
cd gps-saas-deployment-fixed

# 5. Configure environment
cp .env.example .env  # If exists, otherwise .env is already there
nano .env  # Edit all values

# 6. Start services
docker compose -f docker-compose.prod.yml up -d

# 7. Monitor startup
docker compose -f docker-compose.prod.yml logs -f
# Press Ctrl+C when all services show "started"

# 8. Verify
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3001/health
```

---

### Option 3: MAKEFILE COMMANDS (Developer-Friendly)

```bash
# Deploy everything
make deploy

# View logs
make logs

# Restart services
make restart

# Stop services
make down

# Clean everything
make clean
```

---

## 🔧 ESSENTIAL CONFIGURATION

### Required Environment Variables (.env file)

```bash
# Generate secure password (Linux/Mac):
openssl rand -base64 32

# Generate JWT secret:
openssl rand -base64 32
```

**Minimum Required Changes:**

1. **DB_PASSWORD** - Your database password (min 12 characters)
2. **JWT_SECRET** - Random 32+ character string
3. **SMTP_USER** - Your email address (for notifications)
4. **SMTP_PASS** - Gmail app password (not regular password!)
5. **GPS_SERVER_KEY** - Random string for GPS device authentication

### Getting Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (custom name)"
3. Name it "GPS Tracking System"
4. Click "Generate"
5. Copy the 16-character password
6. Use this in `SMTP_PASS` variable

---

## 🌐 ACCESSING YOUR APPLICATION

After successful deployment:

| Service | URL | Purpose |
|---------|-----|---------|
| **Web App** | http://YOUR_IP:3000 | Main application interface |
| **API** | http://YOUR_IP:3001 | Backend API |
| **API Docs** | http://YOUR_IP:3001/api/docs | Swagger documentation |
| **Health Check** | http://YOUR_IP:3001/health | Service status |

### Default Login Credentials

```
Email:    admin@gps-free-saas.com
Password: admin123
```

**⚠️ CHANGE IMMEDIATELY AFTER FIRST LOGIN!**

---

## 📍 GPS DEVICE CONFIGURATION

Configure your GPS devices to send data to:

| Protocol | Port | Server Address |
|----------|------|----------------|
| **GT06** | 5000 | YOUR_SERVER_IP |
| **TK103** | 5001 | YOUR_SERVER_IP |
| **H02** | 5002 | YOUR_SERVER_IP |

Example device configuration:
```
Server IP:   3.108.114.12
Server Port: 5000
APN:         internet  (or your carrier's APN)
```

---

## 🔍 VERIFICATION CHECKLIST

After deployment, verify everything works:

```bash
# 1. Check all containers are running
docker compose -f docker-compose.prod.yml ps
# All should show "Up" status

# 2. Test API
curl http://localhost:3001/health
# Should return: {"status":"ok",...}

# 3. Test web app
curl -I http://localhost:3000
# Should return: HTTP/1.1 200 OK

# 4. Check logs for errors
docker compose -f docker-compose.prod.yml logs --tail=50
# Should not show critical errors

# 5. Test database
docker exec gps_postgres pg_isready -U gpsadmin
# Should return: accepting connections
```

---

## 🛡️ FIREWALL CONFIGURATION

### AWS Lightsail

1. Go to your instance
2. Click "Networking" tab
3. Under "IPv4 Firewall", add rules:

| Application | Protocol | Port Range |
|-------------|----------|------------|
| HTTP | TCP | 80 |
| HTTPS | TCP | 443 |
| Custom | TCP | 3000 |
| Custom | TCP | 3001 |
| Custom | TCP | 5000-5002 |

### Ubuntu UFW

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 5000:5002/tcp
sudo ufw enable
```

---

## 📊 MONITORING & MAINTENANCE

### View Real-Time Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f gps-server
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Database Backup

```bash
# Manual backup
docker exec gps_postgres pg_dump -U gpsadmin gpstrack > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20240315.sql | docker exec -i gps_postgres psql -U gpsadmin gpstrack
```

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

---

## 🚨 TROUBLESHOOTING

### Issue: "Docker API version too old"

**Solution:**
```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Issue: "Environment variable not set"

**Solution:**
```bash
# Make sure .env file exists and has proper values
ls -la .env
cat .env | grep -E "(DB_PASSWORD|JWT_SECRET|SMTP)"

# Reload environment
source .env
```

### Issue: "Port already in use"

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill the process or change ports in docker-compose.prod.yml
```

### Issue: "Container fails to start"

**Solution:**
```bash
# View detailed logs
docker compose -f docker-compose.prod.yml logs backend

# Rebuild from scratch
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Check database is running
docker exec gps_postgres pg_isready -U gpsadmin

# Verify connection string
echo $DATABASE_URL

# Check logs
docker compose -f docker-compose.prod.yml logs postgres
```

---

## 🎯 NEXT STEPS

1. **✅ Change Default Password**
   - Login at http://YOUR_IP:3000
   - Go to Settings > Profile
   - Change password

2. **🗺️ Add Your First Device**
   - Navigate to Devices > Add Device
   - Enter device IMEI
   - Configure device with server IP and port

3. **📧 Setup Email Notifications**
   - Verify SMTP settings in .env
   - Test email in Settings > Notifications

4. **🔒 Setup SSL (Optional)**
   - Get domain name
   - Install Certbot
   - Configure Nginx SSL

5. **📊 Monitor System**
   - Check logs regularly
   - Monitor disk space
   - Setup automated backups

---

## 💡 USEFUL COMMANDS REFERENCE

```bash
# Start services
docker compose -f docker-compose.prod.yml up -d

# Stop services
docker compose -f docker-compose.prod.yml down

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart single service
docker compose -f docker-compose.prod.yml restart backend

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Shell into container
docker exec -it gps_backend sh

# Database CLI
docker exec -it gps_postgres psql -U gpsadmin -d gpstrack

# Redis CLI
docker exec -it gps_redis redis-cli

# Check service status
docker compose -f docker-compose.prod.yml ps

# View resource usage
docker stats

# Clean unused resources
docker system prune -a
```

---

## 📞 SUPPORT & DOCUMENTATION

- **Full Documentation**: See DEPLOYMENT-GUIDE.md
- **User Manual**: See USER-MANUAL.md
- **Troubleshooting**: See TROUBLESHOOTING.md
- **API Documentation**: http://YOUR_IP:3001/api/docs

---

## 🎉 SUCCESS!

If you've followed this guide and see:
- ✅ All containers running
- ✅ Health check returns "ok"
- ✅ Web app accessible
- ✅ No critical errors in logs

**Congratulations! Your GPS tracking system is live! 🚀**

---

**Last Updated**: March 2024  
**Version**: 2.0 (Fixed)

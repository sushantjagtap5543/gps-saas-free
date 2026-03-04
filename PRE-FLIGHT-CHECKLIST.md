# ✈️ PRE-FLIGHT DEPLOYMENT CHECKLIST

Use this checklist before deploying to ensure a smooth deployment.

---

## 📋 BEFORE YOU START

### System Requirements
- [ ] Ubuntu 22.04 LTS (or compatible Linux)
- [ ] Minimum 2GB RAM
- [ ] Minimum 20GB free disk space
- [ ] Static IP address assigned
- [ ] Root or sudo access
- [ ] Internet connection

### Required Information
- [ ] Server IP address: __________________
- [ ] Domain name (optional): __________________
- [ ] Gmail account for SMTP: __________________
- [ ] Gmail app password generated: __________________

---

## 🔧 CONFIGURATION CHECKLIST

### .env File Configuration
- [ ] `.env` file exists in project root
- [ ] `DB_PASSWORD` changed from default (min 12 chars)
- [ ] `JWT_SECRET` set (min 32 chars random)
- [ ] `SMTP_HOST` configured (smtp.gmail.com for Gmail)
- [ ] `SMTP_PORT` set (587 for Gmail)
- [ ] `SMTP_USER` set to your email
- [ ] `SMTP_PASS` set to Gmail app password (16 chars)
- [ ] `GPS_SERVER_KEY` set (min 32 chars random)
- [ ] `FRONTEND_URL` updated with your IP
- [ ] `NEXT_PUBLIC_API_URL` updated with your IP
- [ ] `NEXT_PUBLIC_WS_URL` updated with your IP

### Generate Secrets
```bash
# Generate DB password
openssl rand -base64 24

# Generate JWT secret
openssl rand -base64 32

# Generate GPS server key
openssl rand -base64 32
```

---

## 🌐 NETWORK CHECKLIST

### Firewall Configuration

#### AWS Lightsail
- [ ] Instance created and running
- [ ] Static IP attached
- [ ] Networking tab opened
- [ ] IPv4 Firewall rules added:
  - [ ] HTTP (TCP/80)
  - [ ] HTTPS (TCP/443)
  - [ ] Custom (TCP/3000)
  - [ ] Custom (TCP/3001)
  - [ ] Custom (TCP/5000-5002)
  - [ ] SSH (TCP/22) - Already there

#### Ubuntu UFW
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # Frontend
sudo ufw allow 3001/tcp # Backend
sudo ufw allow 5000:5002/tcp  # GPS ports
sudo ufw enable
```

- [ ] UFW firewall configured
- [ ] All required ports opened
- [ ] UFW enabled

---

## 📧 EMAIL CONFIGURATION CHECKLIST

### Gmail Setup
- [ ] Gmail account exists
- [ ] 2-Factor Authentication enabled
- [ ] App Password generated
  - Go to: https://myaccount.google.com/apppasswords
  - [ ] Selected "Mail"
  - [ ] Selected "Other (custom name)"
  - [ ] Named it "GPS Tracking"
  - [ ] Copied 16-character password
- [ ] App password added to .env file

### Test Email (Optional)
```bash
# After deployment, test with:
curl -X POST http://localhost:3001/api/test-email
```

---

## 🐳 DOCKER CHECKLIST

### Docker Installation
- [ ] Docker installed (or will be installed by script)
- [ ] Docker version 20.10+ (check: `docker --version`)
- [ ] Docker API version 1.44+ (check: `docker version --format '{{.Client.APIVersion}}'`)
- [ ] Docker Compose plugin installed (check: `docker compose version`)
- [ ] User added to docker group (check: `groups $USER`)

### If Docker Not Installed
```bash
# The deploy.sh script will install it automatically
# Or install manually:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## 📦 FILES CHECKLIST

### Required Files
- [ ] `docker-compose.prod.yml` exists
- [ ] `.env` file exists and configured
- [ ] `deploy.sh` exists and executable
- [ ] `backend/` directory exists
- [ ] `frontend/` directory exists
- [ ] `gps-server/` directory exists
- [ ] `infra/` directory exists
- [ ] All Dockerfiles present

### File Permissions
```bash
# Set correct permissions
chmod +x deploy.sh
chmod +x diagnose.sh
chmod 644 .env
chmod 644 docker-compose.prod.yml
```

- [ ] `deploy.sh` is executable
- [ ] `diagnose.sh` is executable
- [ ] `.env` has correct permissions (644)

---

## 🚀 DEPLOYMENT READINESS

### Pre-Deployment Verification
```bash
# Check system
free -h  # Verify RAM
df -h    # Verify disk space
cat /etc/os-release  # Verify OS

# Verify .env file
cat .env | grep -E "(DB_PASSWORD|JWT_SECRET|SMTP)"

# Verify docker-compose file
docker compose -f docker-compose.prod.yml config --quiet
```

- [ ] System meets requirements
- [ ] .env file validates
- [ ] docker-compose.prod.yml is valid
- [ ] Internet connection working
- [ ] Have SSH access to server

---

## 🎯 DEPLOYMENT STEPS

When all above items are checked:

```bash
# 1. Navigate to project directory
cd /path/to/gps-saas-deployment-fixed

# 2. Review configuration one last time
cat .env

# 3. Run deployment
./deploy.sh
```

### Monitor Deployment
- [ ] Script starts without errors
- [ ] Docker installation succeeds (if needed)
- [ ] Environment validation passes
- [ ] Services build successfully
- [ ] All containers start
- [ ] Health checks pass
- [ ] Access information displayed

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Immediate Checks
```bash
# All containers running
docker compose -f docker-compose.prod.yml ps

# Health check
curl http://localhost:3001/health

# Frontend accessible
curl -I http://localhost:3000

# Check logs for errors
docker compose -f docker-compose.prod.yml logs --tail=50
```

- [ ] All 6 containers showing "Up"
- [ ] Backend health check returns {"status":"ok"}
- [ ] Frontend returns HTTP 200
- [ ] No critical errors in logs

### Service-Specific Checks
```bash
# Database
docker exec gps_postgres pg_isready -U gpsadmin

# Redis
docker exec gps_redis redis-cli ping

# Backend API
curl http://localhost:3001/api/docs

# GPS Server
netstat -tlnp | grep -E '5000|5001|5002'
```

- [ ] Database accepting connections
- [ ] Redis responding to PING
- [ ] API documentation accessible
- [ ] GPS ports listening

---

## 🌐 EXTERNAL ACCESS VERIFICATION

### From External Machine
```bash
# Replace YOUR_IP with your server's IP
curl http://YOUR_IP:3000
curl http://YOUR_IP:3001/health
```

- [ ] Web app accessible from external IP
- [ ] API accessible from external IP
- [ ] Can login to web interface

---

## 🔐 SECURITY CHECKLIST

### Immediate Security Tasks
- [ ] Change default admin password
  - Login at http://YOUR_IP:3000
  - Email: admin@gps-free-saas.com
  - Password: admin123
  - Go to Settings > Profile > Change Password
  
- [ ] Verify .env permissions (should be 644, not world-readable)
```bash
ls -la .env
# Should show: -rw-r--r--
```

- [ ] Consider setting up SSL (optional)
```bash
# Install Certbot for Let's Encrypt
sudo apt-get install certbot
sudo certbot --nginx -d yourdomain.com
```

---

## 📊 MONITORING SETUP

### Set Up Regular Monitoring
- [ ] Bookmark monitoring pages:
  - Web App: http://YOUR_IP:3000
  - API Docs: http://YOUR_IP:3001/api/docs
  - Health: http://YOUR_IP:3001/health

- [ ] Create monitoring script (optional):
```bash
#!/bin/bash
# save as monitor.sh
while true; do
    clear
    echo "=== GPS Tracking System Status ==="
    echo "Time: $(date)"
    echo ""
    docker compose -f docker-compose.prod.yml ps
    echo ""
    curl -sf http://localhost:3001/health | jq .
    sleep 30
done
```

---

## 🔄 BACKUP STRATEGY

### Initial Backup
```bash
# Create first backup
make backup

# Verify backup exists
ls -lh backups/
```

- [ ] Initial backup created
- [ ] Backup file exists in backups/
- [ ] Backup is not zero-sized

### Set Up Automated Backups (Optional)
```bash
# Add to crontab
crontab -e

# Add this line (daily backup at 2 AM):
0 2 * * * cd /path/to/gps-saas-deployment-fixed && make backup
```

- [ ] Automated backup scheduled (optional)

---

## 📱 GPS DEVICE TESTING

### Configure Test Device
- [ ] Device IMEI noted
- [ ] Device powered on
- [ ] SIM card with data plan inserted
- [ ] Device configured with:
  - Server IP: YOUR_IP
  - Server Port: 5000 (or 5001, 5002 depending on protocol)
  - APN: Your carrier's APN

### Test Connection
```bash
# Monitor GPS server logs
docker compose -f docker-compose.prod.yml logs -f gps-server

# Should see incoming connections when device sends data
```

- [ ] Device connects successfully
- [ ] GPS data visible in logs
- [ ] Location appears on map in web interface

---

## 📝 DOCUMENTATION

### Keep This Information Safe
Document and save securely:

```
Server IP: _______________
Domain: _______________
Admin Email: _______________
Admin Password: _______________ (changed from default)
DB Password: _______________
JWT Secret: _______________
SMTP Email: _______________
SMTP App Password: _______________
```

- [ ] All credentials documented
- [ ] Stored in password manager
- [ ] Backup of credentials created

---

## 🎉 DEPLOYMENT COMPLETE!

If ALL items above are checked:

✅ **Your GPS tracking system is fully deployed and production-ready!**

### Next Steps:
1. Add your first GPS device
2. Invite team members (if applicable)
3. Set up email notifications
4. Configure geofences and alerts
5. Test all features

### Useful Commands Reference:
```bash
make help       # Show all commands
make status     # Check system status
make logs       # View all logs
make backup     # Create backup
make diagnose   # Run diagnostics
```

---

## 🆘 IF SOMETHING GOES WRONG

1. **Don't panic!**
2. Run diagnostics:
   ```bash
   ./diagnose.sh
   ```

3. Check troubleshooting guide:
   ```bash
   cat TROUBLESHOOTING.md
   ```

4. View logs:
   ```bash
   make logs
   ```

5. If needed, clean restart:
   ```bash
   make clean
   ./deploy.sh
   ```

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Server Location**: _____________  
**Purpose**: _____________

---

**Good luck with your deployment! 🚀**

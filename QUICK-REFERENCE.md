# 🚀 GPS-FREE-SAAS QUICK REFERENCE GUIDE

**All Commands | Configuration | Troubleshooting**

---

## ⚡ ESSENTIAL COMMANDS

### Service Management

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose down

# View service status
docker-compose ps

# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f gps-server
docker-compose logs -f postgres

# Restart service
docker-compose restart backend

# Full restart (clean rebuild)
docker-compose down -v
docker-compose up -d --build
```

### Database Operations

```bash
# Create backup
docker-compose exec postgres pg_dump -U gpsadmin gpstrack > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U gpsadmin gpstrack < backup.sql

# Access database shell
docker-compose exec postgres psql -U gpsadmin -d gpstrack

# Check database status
docker-compose exec postgres pg_isready -U gpsadmin -d gpstrack
```

### Testing & Health Checks

```bash
# API health check
curl http://localhost:3001/health

# API documentation
curl http://localhost:3001/api/docs

# WebSocket test
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:3001

# Test GPS port (GT06)
nc -zv localhost 5000

# Test GPS port (TK103)
nc -zv localhost 5001

# Test GPS port (H02)
nc -zv localhost 5002
```

---

## 📋 CONFIGURATION FILES

### Environment Variables (.env)

```bash
# Location
./infra/.env

# Key Variables
DB_PASSWORD=your_secure_password
JWT_SECRET=2muz93QfGa25xG3T5C8nfOWW960T6jhIn8KYxv4aY7ojY2YJNgY83lh0jdCsnWC8
GPS_SERVER_KEY=your_gps_server_key
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_gmail_app_password
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

### Docker Compose

```bash
# Production file
./docker-compose.prod.yml

# Services defined:
# - postgres (port 5432)
# - redis (port 6379)
# - gps-server (ports 5000-5002, 4000)
# - backend (port 3001)
# - web (port 3000)
# - nginx (ports 80, 443)
```

### Nginx Configuration

```bash
# Location
./infra/nginx.conf

# Handles:
# - SSL/TLS termination
# - Reverse proxy for backend
# - Frontend serving
# - WebSocket proxying
```

---

## 🔑 DEFAULT CREDENTIALS

⚠️ **CHANGE IMMEDIATELY AFTER DEPLOYMENT** ⚠️

```
Super Admin:
  Email:    admin@gps.com
  Password: admin123

Demo Client:
  Email:    client@demo.com
  Password: client123
```

---

## 📊 SERVICE PORTS

| Service | Internal | External | Purpose |
|---------|----------|----------|---------|
| Frontend | 3000 | 80, 443 | React SPA |
| Backend | 3001 | 80, 443 | REST API |
| PostgreSQL | 5432 | (private) | Database |
| Redis | 6379 | (private) | Cache |
| GT06 | 5000 | 5000 | GPS Protocol |
| TK103 | 5001 | 5001 | GPS Protocol |
| H02 | 5002 | 5002 | GPS Protocol |
| Nginx | 4000 | 80, 443 | Reverse Proxy |

---

## 🔒 SECURITY CHECKLIST

- [ ] Default credentials changed
- [ ] JWT_SECRET is strong (64+ chars)
- [ ] DB_PASSWORD is strong (32+ chars)
- [ ] SMTP credentials configured
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Backups automated
- [ ] SSH key secured
- [ ] Email notifications tested
- [ ] Database encryption enabled (optional)

---

## 🐛 COMMON ISSUES & FIXES

### Services Won't Start
```bash
# Check logs
docker-compose logs

# Verify resources
free -h
df -h

# Restart everything
docker-compose down
docker-compose up -d --build

# Check specific service
docker-compose logs postgres
```

### Database Connection Failed
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U gpsadmin

# Check logs
docker-compose logs postgres

# Reset (WARNING: deletes data!)
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose up -d
```

### GPS Data Not Arriving
```bash
# Check server logs
docker-compose logs gps-server

# Test port
telnet YOUR_IP 5000

# Check firewall
sudo ufw status

# Verify device configuration
# Device should send to: YOUR_IP:5000
```

### High Memory Usage
```bash
# Check memory
free -h
docker stats

# Restart service
docker-compose restart backend

# Check for leaks
docker-compose logs backend | grep -i memory
```

### Disk Space Issues
```bash
# Check disk
df -h

# Clean up Docker
docker system prune -a

# Remove old backups
rm ~/backups/gpstrack-*.sql.gz  # Keep latest
```

### SSL Certificate Errors
```bash
# Check certificate
openssl x509 -in ./ssl/fullchain.pem -text -noout

# Renew Let's Encrypt
sudo certbot renew

# Copy certificate
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/

# Restart
docker-compose down
docker-compose up -d
```

---

## 📈 MONITORING COMMANDS

### System Health

```bash
# CPU and Memory
top -bn1 | head -20

# Disk usage
df -h
du -sh ~/projects/gps-saas-free/*

# Network
netstat -tuln | grep LISTEN

# Process count
ps aux | wc -l
```

### Docker Health

```bash
# Container status
docker-compose ps

# Resource usage
docker stats

# Image sizes
docker images | grep gps

# Volume usage
docker volume ls
```

### Application Health

```bash
# API health
curl http://localhost:3001/health

# Database health
docker-compose exec postgres pg_isready -U gpsadmin

# Redis health
docker-compose exec redis redis-cli ping

# GPS server status
docker-compose logs gps-server | tail -20
```

---

## 🔄 MAINTENANCE SCHEDULE

### Daily
- [ ] Check service status: `docker-compose ps`
- [ ] Review error logs: `docker-compose logs`
- [ ] Monitor disk space: `df -h`

### Weekly
- [ ] Database backup: `docker-compose exec postgres pg_dump...`
- [ ] Test backups: `ls -lh ~/backups/`
- [ ] Update packages: `sudo apt update && sudo apt upgrade -y`

### Monthly
- [ ] Security review
- [ ] Dependency updates: `npm update`
- [ ] Database optimization
- [ ] SSL certificate renewal (if Let's Encrypt)

### Quarterly
- [ ] Full system audit
- [ ] Performance review
- [ ] Capacity planning
- [ ] Disaster recovery test

---

## 🔐 BACKUP & RESTORE

### Automated Backup Setup

```bash
# Create cron job for daily backup
crontab -e

# Add line (backup at 2 AM):
0 2 * * * cd ~/projects/gps-saas-free && docker-compose exec -T postgres pg_dump -U gpsadmin gpstrack > ~/backups/gpstrack-$(date +\%Y\%m\%d).sql

# Verify cron job
crontab -l
```

### Manual Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U gpsadmin gpstrack > backup-$(date +%Y%m%d).sql

# Compress
gzip backup-*.sql

# List backups
ls -lh ~/backups/
```

### Restore Backup

```bash
# From backup file
docker-compose exec -T postgres psql -U gpsadmin gpstrack < backup.sql

# Verify restore
docker-compose exec postgres psql -U gpsadmin -d gpstrack -c "SELECT COUNT(*) FROM vehicles;"
```

---

## 🚀 DEPLOYMENT CHECKLIST

```bash
# Pre-deployment
- [ ] System updated: sudo apt update && sudo apt upgrade -y
- [ ] Docker installed: docker --version
- [ ] Docker Compose installed: docker-compose --version
- [ ] Repository cloned: git clone ...
- [ ] .env configured: cat infra/.env | grep -v "^#"

# Deployment
- [ ] Images built: docker-compose build
- [ ] Services started: docker-compose up -d
- [ ] Health check passed: curl http://localhost:3001/health
- [ ] Database migrated: docker-compose logs | grep "migration"
- [ ] Frontend loads: curl http://localhost:3000

# Post-deployment
- [ ] Default credentials changed
- [ ] SSL certificates configured
- [ ] Firewall rules set
- [ ] Email configured and tested
- [ ] Backups automated
- [ ] Monitoring enabled
- [ ] Documentation updated
```

---

## 📱 GPS DEVICE CONFIGURATION

### GT06 Configuration

```
# Set server IP and port
SERVER,0,YOUR_IP,5000,0#

# Check status
STATUS#

# Enable GPS
GPSON#

# Set location update interval (10 seconds)
GPSNMEA,10#
```

### TK103 Configuration

```
# Set server IP and port
SERVER,0,YOUR_IP,5001,0#

# Enable tracking
GPSON#

# Set location interval
INTERVAL,10#
```

### H02 Configuration

```
# Set server IP and port
SERVER,YOUR_IP,5002#

# Enable GPS
GPSON#

# Set update interval
INTERVAL,10,60#
```

---

## 🔗 IMPORTANT URLS

```
API Documentation:     http://YOUR_IP/api/docs
Frontend:              http://YOUR_IP/
Health Check:          http://YOUR_IP/api/health
WebSocket:             ws://YOUR_IP
```

---

## 📞 QUICK SUPPORT

### Getting Help
1. Check logs: `docker-compose logs [service]`
2. Review README.md
3. Check FIXES_SUMMARY.md
4. Contact: sushantjagtap5543@gmail.com

### Reporting Issues
Include:
- Error message
- Service logs
- Docker version
- System specs
- Reproduction steps

---

## 💾 FILE LOCATIONS

```
Project Root:           ~/projects/gps-saas-free/
Environment Config:     ./infra/.env
Docker Compose:         ./docker-compose.prod.yml
Nginx Config:           ./infra/nginx.conf
SSL Certificates:       ./ssl/
Database Backups:       ~/backups/
Application Logs:       docker-compose logs
```

---

## ⏱️ COMMON TIMEOUTS & WAITS

```
Service startup:        30-60 seconds
Database migration:     10-30 seconds
Image rebuild:          5-10 minutes
Backup/restore:         Depends on size
SSL certificate:        Instant to 10 minutes
```

---

## 🎯 PERFORMANCE OPTIMIZATION

### Nginx Caching
```bash
# Edit ./infra/nginx.conf
# Add caching headers for static assets
add_header Cache-Control "public, max-age=86400";
```

### Database Optimization
```bash
# Check slow queries
docker-compose exec postgres psql -U gpsadmin -c "SELECT * FROM pg_stat_statements;"

# Analyze table
docker-compose exec postgres psql -U gpsadmin -d gpstrack -c "ANALYZE vehicles;"
```

### Redis Optimization
```bash
# Monitor Redis
docker-compose exec redis redis-cli

# Check memory
> INFO memory

# Clear cache (careful!)
> FLUSHDB
```

---

## 🔄 UPGRADE PROCEDURES

### Update Docker Images
```bash
# Pull latest images
docker-compose pull

# Rebuild with new base images
docker-compose down
docker-compose up -d --build

# Clean up old images
docker image prune -a
```

### Update Application Code
```bash
# Pull latest code
cd ~/projects/gps-saas-free
git pull origin main

# Rebuild services
docker-compose down
docker-compose up -d --build

# Run migrations
docker-compose exec backend npm run db:migrate:deploy
```

### Database Upgrade (Prisma)
```bash
# Check pending migrations
docker-compose exec backend npx prisma migrate status

# Apply migrations
docker-compose exec backend npx prisma migrate deploy
```

---

**Generated**: March 4, 2026  
**Status**: PRODUCTION READY ✅  
**Version**: 1.0.0

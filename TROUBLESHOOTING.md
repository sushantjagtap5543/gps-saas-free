# 🔧 TROUBLESHOOTING GUIDE - GPS-FREE-SAAS

Complete solutions for all known deployment and runtime issues.

---

## 🚨 COMMON DEPLOYMENT ERRORS

### Error 1: "Docker API version 1.43 is too old"

**Symptoms:**
```
Error response from daemon: client version 1.43 is too old. 
Minimum supported API version is 1.44
```

**Root Cause:** Outdated Docker installation

**Solutions:**

**Option A - Automated Fix:**
```bash
./deploy.sh  # The script handles this automatically
```

**Option B - Manual Fix:**
```bash
# Remove old Docker
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install latest Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify version
docker version
# Should show API Version 1.44 or higher
```

**Verification:**
```bash
docker version --format '{{.Client.APIVersion}}'
# Should return: 1.44 or higher
```

---

### Error 2: "Variable is not set. Defaulting to blank string"

**Symptoms:**
```
WARN[0000] The "DB_PASSWORD" variable is not set. Defaulting to a blank string.
WARN[0000] The "JWT_SECRET" variable is not set. Defaulting to a blank string.
```

**Root Cause:** Missing or improperly configured .env file

**Solutions:**

1. **Check .env file exists:**
```bash
ls -la .env
# If not exists:
cp .env.example .env  # or use provided .env
```

2. **Verify .env content:**
```bash
cat .env | grep -E "(DB_PASSWORD|JWT_SECRET|SMTP)"
```

3. **Generate secure values:**
```bash
# Generate DB password
openssl rand -base64 24

# Generate JWT secret
openssl rand -base64 32

# Update .env file
nano .env
```

4. **Load environment variables:**
```bash
source .env
export $(cat .env | grep -v '^#' | xargs)
```

5. **Restart with env file explicitly:**
```bash
docker compose --env-file .env -f docker-compose.prod.yml up -d
```

---

### Error 3: "Failed to connect to localhost port 3001"

**Symptoms:**
```
curl: (7) Failed to connect to localhost port 3001: Couldn't connect to server
```

**Root Cause:** Service not running or not ready

**Diagnostic Steps:**

1. **Check if containers are running:**
```bash
docker compose -f docker-compose.prod.yml ps
```

2. **Check backend container specifically:**
```bash
docker ps --filter "name=gps_backend"
```

3. **View backend logs:**
```bash
docker compose -f docker-compose.prod.yml logs backend
```

**Solutions:**

**If container not running:**
```bash
# Start services
docker compose -f docker-compose.prod.yml up -d

# Force rebuild if needed
docker compose -f docker-compose.prod.yml up -d --build
```

**If container running but not responding:**
```bash
# Check health status
docker inspect gps_backend | grep -A 10 Health

# Wait longer (services need 30-60 seconds to initialize)
sleep 60
curl http://localhost:3001/health
```

**If still failing:**
```bash
# Check if port is accessible inside container
docker exec gps_backend curl -f http://localhost:3001/health

# Check if database is ready
docker exec gps_postgres pg_isready -U gpsadmin

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

---

### Error 4: "No configuration file provided: not found"

**Symptoms:**
```
no configuration file provided: not found
```

**Root Cause:** Docker Compose file not found or incorrect path

**Solutions:**

1. **Verify file exists:**
```bash
ls -la docker-compose.prod.yml
```

2. **Check current directory:**
```bash
pwd
# Should be in project root
```

3. **Use full path:**
```bash
docker compose -f /full/path/to/docker-compose.prod.yml up -d
```

4. **Fix file permissions:**
```bash
chmod 644 docker-compose.prod.yml
```

---

### Error 5: "Port is already allocated"

**Symptoms:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Root Cause:** Another service using the port

**Solutions:**

1. **Find what's using the port:**
```bash
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :5432
```

2. **Kill the conflicting process:**
```bash
# Get PID from lsof output, then:
sudo kill -9 <PID>
```

3. **Or change ports in docker-compose.prod.yml:**
```yaml
services:
  web:
    ports:
      - "8080:3000"  # Change external port to 8080
```

4. **Stop other docker containers:**
```bash
docker ps -a
docker stop $(docker ps -q)
```

---

## 🗄️ DATABASE ISSUES

### Issue: "Database connection failed"

**Diagnostic:**
```bash
# Check Postgres is running
docker compose -f docker-compose.prod.yml ps postgres

# Test connection
docker exec gps_postgres pg_isready -U gpsadmin -d gpstrack

# Check logs
docker compose -f docker-compose.prod.yml logs postgres
```

**Solutions:**

1. **Wait for database initialization:**
```bash
# First startup takes 30-60 seconds
docker compose -f docker-compose.prod.yml logs -f postgres
# Wait for "database system is ready to accept connections"
```

2. **Verify credentials:**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test manual connection
docker exec -it gps_postgres psql -U gpsadmin -d gpstrack
# Should connect without errors
```

3. **Reset database:**
```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

---

### Issue: "Prisma migrations failed"

**Diagnostic:**
```bash
docker compose -f docker-compose.prod.yml logs backend | grep prisma
```

**Solutions:**

1. **Run migrations manually:**
```bash
docker exec gps_backend npx prisma migrate deploy
```

2. **Reset and re-migrate:**
```bash
docker exec gps_backend npx prisma migrate reset --force
docker exec gps_backend npx prisma migrate deploy
```

3. **Generate Prisma client:**
```bash
docker exec gps_backend npx prisma generate
```

---

## 🌐 NETWORK ISSUES

### Issue: "Cannot access from browser"

**Checklist:**

1. **Verify services are running:**
```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3000
```

2. **Check firewall:**
```bash
# AWS Lightsail - Check instance firewall rules
# Should allow ports: 80, 443, 3000, 3001, 5000-5002

# Ubuntu UFW
sudo ufw status
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

3. **Test from server:**
```bash
curl http://localhost:3000
curl http://localhost:3001/health
```

4. **Test from external:**
```bash
# From your local machine
curl http://YOUR_SERVER_IP:3000
```

5. **Check nginx if using:**
```bash
docker compose -f docker-compose.prod.yml logs nginx
```

---

### Issue: "WebSocket connection failed"

**Symptoms:**
```
WebSocket connection to 'ws://localhost:3001' failed
```

**Solutions:**

1. **Check WebSocket port in environment:**
```bash
grep NEXT_PUBLIC_WS_URL .env
# Should match backend port
```

2. **Verify backend supports WebSocket:**
```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i websocket
```

3. **Update frontend environment:**
```bash
# In .env
NEXT_PUBLIC_WS_URL=ws://YOUR_SERVER_IP:3001

# Rebuild frontend
docker compose -f docker-compose.prod.yml up -d --build web
```

---

## 📧 EMAIL ISSUES

### Issue: "Failed to send email"

**Diagnostic:**
```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i smtp
```

**Solutions for Gmail:**

1. **Use App Password (not regular password):**
   - Go to https://myaccount.google.com/apppasswords
   - Generate new app password
   - Update .env:
   ```bash
   SMTP_PASS=your-16-char-app-password
   ```

2. **Enable 2FA on Gmail:**
   - Required for app passwords
   - https://myaccount.google.com/security

3. **Check SMTP settings:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=app-password-here
   ```

4. **Test SMTP connection:**
```bash
docker exec gps_backend node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: '${SMTP_HOST}',
  port: ${SMTP_PORT},
  auth: { user: '${SMTP_USER}', pass: '${SMTP_PASS}' }
});
transport.verify((err, success) => {
  console.log(err || 'SMTP Ready');
});
"
```

---

## 🔌 GPS DEVICE ISSUES

### Issue: "GPS device not sending data"

**Diagnostic:**

1. **Check GPS server logs:**
```bash
docker compose -f docker-compose.prod.yml logs gps-server
```

2. **Verify ports are open:**
```bash
sudo netstat -tlnp | grep -E '5000|5001|5002'
```

3. **Test port connectivity:**
```bash
# From another machine
telnet YOUR_SERVER_IP 5000
```

**Solutions:**

1. **Check device configuration:**
   - Server IP: YOUR_SERVER_IP
   - Server Port: 5000 (GT06), 5001 (TK103), 5002 (H02)
   - APN: Your carrier's APN

2. **Verify firewall allows GPS ports:**
```bash
sudo ufw allow 5000:5002/tcp
```

3. **Check GPS server is listening:**
```bash
docker exec gps_server netstat -tlnp | grep :5000
```

4. **Monitor GPS server in real-time:**
```bash
docker compose -f docker-compose.prod.yml logs -f gps-server
# Should show incoming connections
```

---

## 💾 STORAGE ISSUES

### Issue: "No space left on device"

**Diagnostic:**
```bash
df -h
docker system df
```

**Solutions:**

1. **Clean Docker resources:**
```bash
# Remove unused containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes (CAUTION: May delete data)
docker volume prune -f

# Clean everything
docker system prune -a --volumes -f
```

2. **Clean logs:**
```bash
# Limit Docker log size (create/edit daemon.json)
sudo nano /etc/docker/daemon.json

# Add:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker
sudo systemctl restart docker
```

---

## 🔄 DEPLOYMENT SCRIPT ISSUES

### Issue: "Permission denied" when running deploy.sh

**Solution:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Issue: "Script fails at Docker installation"

**Solution:**
```bash
# Run Docker installation separately
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Then run rest of deployment
```

---

## 🧹 CLEAN REINSTALL

If all else fails, start fresh:

```bash
# 1. Stop and remove everything
docker compose -f docker-compose.prod.yml down -v
docker system prune -a --volumes -f

# 2. Remove project directory
cd ..
rm -rf gps-saas-deployment-fixed

# 3. Re-upload and extract fresh copy
# ... upload new zip ...

# 4. Start deployment from beginning
cd gps-saas-deployment-fixed
./deploy.sh
```

---

## 📋 DIAGNOSTIC COMMANDS CHECKLIST

Run these to collect information for debugging:

```bash
#!/bin/bash
echo "=== System Info ==="
uname -a
cat /etc/os-release

echo -e "
=== Docker Info ==="
docker version
docker compose version

echo -e "
=== Container Status ==="
docker compose -f docker-compose.prod.yml ps

echo -e "
=== Environment Variables ==="
cat .env | grep -v "PASS\|SECRET"

echo -e "
=== Port Status ==="
sudo netstat -tlnp | grep -E '3000|3001|5000|5001|5002|5432|6379'

echo -e "
=== Disk Space ==="
df -h
docker system df

echo -e "
=== Recent Logs ==="
docker compose -f docker-compose.prod.yml logs --tail=50

echo -e "
=== Health Checks ==="
curl -f http://localhost:3001/health
docker exec gps_postgres pg_isready -U gpsadmin
docker exec gps_redis redis-cli ping
```

Save this as `diagnose.sh`, run with:
```bash
chmod +x diagnose.sh
./diagnose.sh > diagnostic_output.txt
```

---

## 📞 GET HELP

If issues persist:

1. **Check logs:** 
   ```bash
   docker compose -f docker-compose.prod.yml logs > full_logs.txt
   ```

2. **Run diagnostics:**
   ```bash
   ./diagnose.sh > diagnostics.txt
   ```

3. **Create an issue** with:
   - Error message
   - What you tried
   - diagnostic_output.txt
   - full_logs.txt (remove sensitive data first!)

---

**Remember:** Most deployment issues are due to:
1. Outdated Docker version
2. Missing environment variables
3. Port conflicts
4. Not waiting long enough for services to start

Take your time and follow each step carefully! 🚀

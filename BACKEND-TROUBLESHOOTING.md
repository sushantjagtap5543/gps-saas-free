# 🔧 Backend Container Failed - Here's How to Fix It

## What Happened

The backend container started but became unhealthy. This is typically caused by:
1. Database connection issues
2. Migration problems
3. Missing environment variables

## ✅ v3.5 FIXES THIS!

I've created **v3.5-RUNTIME-FIXED** which includes:

### 1. **Better Startup Script** (`entrypoint.sh`)
- Waits for database to be ready
- Runs migrations automatically
- Seeds database on first run
- Better error handling

### 2. **Improved Dockerfile**
- Proper startup sequence
- Better health checks
- Clear logging

---

## 🚀 Deploy v3.5

```bash
# On your server, clean up first
cd ~
sudo rm -rf gps-saas-free
docker compose -f gps-saas-free/docker-compose.prod.yml down 2>/dev/null || true
docker system prune -f

# Upload new version
# (Upload gps-saas-v3.5-RUNTIME-FIXED.zip to your server)

# Extract and deploy
unzip gps-saas-v3.5-RUNTIME-FIXED.zip
cd gps-saas-FIXED-FINAL

# Copy your .env file
cp ~/production.env .env

# Deploy
./deploy.sh
```

---

## 📊 Check Logs While It Starts

In a separate terminal, watch the logs:

```bash
# Watch all services
docker compose -f docker-compose.prod.yml logs -f

# Or just backend
docker compose -f docker-compose.prod.yml logs -f backend
```

You should see:
```
🚀 Starting GPS-FREE-SAAS Backend...
⏳ Waiting for database to be ready...
📊 Running database migrations...
✓ Migrations complete
🌱 Seeding database...
✓ Seed complete
✅ Starting NestJS application...
[Nest] Application successfully started
```

---

## 🔍 If Backend Still Fails

### Step 1: Check Backend Logs
```bash
docker compose -f docker-compose.prod.yml logs backend | tail -100
```

### Step 2: Check Database
```bash
# Is database running?
docker exec gps_postgres pg_isready -U gpsadmin

# Can backend connect?
docker exec gps_backend sh -c 'npx prisma db pull' 2>&1
```

### Step 3: Verify Environment
```bash
# Check .env file
cat .env | grep -E "(DB_PASSWORD|JWT_SECRET|DATABASE_URL)"

# Make sure DB_PASSWORD matches in both places:
# 1. DB_PASSWORD=...
# 2. DATABASE_URL=postgresql://gpsadmin:SAME_PASSWORD@postgres:5432/gpstrack
```

### Step 4: Manual Migration (if needed)
```bash
# Enter backend container
docker exec -it gps_backend sh

# Run migration manually
npx prisma migrate deploy

# Check if it worked
npx prisma db pull
```

---

## 🎯 Common Issues & Solutions

### Issue: "Can't reach database"
**Solution**: Database URL might be wrong in .env
```bash
# Should be:
DATABASE_URL=postgresql://gpsadmin:${DB_PASSWORD}@postgres:5432/gpstrack

# NOT:
DATABASE_URL=postgresql://gpsadmin:YOUR_PASSWORD@postgres:5432/gpstrack
```

### Issue: "Migration failed"
**Solution**: Reset database
```bash
docker compose down -v  # This deletes volumes!
docker compose up -d
```

### Issue: "Port 3001 already in use"
**Solution**: Kill the process using it
```bash
sudo lsof -ti:3001 | xargs sudo kill -9
```

---

## ✅ Success Criteria

Backend is working when:

1. **Container shows healthy**:
   ```bash
   docker compose ps
   # gps_backend should show "Up" and "healthy"
   ```

2. **Health check passes**:
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok",...}
   ```

3. **Logs show "started"**:
   ```bash
   docker compose logs backend | grep "successfully started"
   ```

---

## 📞 Still Having Issues?

Run the diagnostic script:
```bash
chmod +x check-backend-logs.sh
./check-backend-logs.sh
```

This will show:
- Backend container logs
- All container statuses
- Database connectivity
- Redis connectivity

---

**TL;DR**: Use v3.5-RUNTIME-FIXED.zip - it has proper startup handling! 🚀

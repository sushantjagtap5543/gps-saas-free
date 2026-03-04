# ⚡ QUICK START GUIDE

## 3 Steps to Deploy

### 1️⃣ Edit Configuration

```bash
nano .env
```

**Change these values:**
- `DB_PASSWORD` → Your secure password
- `JWT_SECRET` → Generate with: `openssl rand -base64 32`
- `SMTP_USER` → Your Gmail address  
- `SMTP_PASS` → Your Gmail app password
- `GPS_SERVER_KEY` → Generate with: `openssl rand -base64 32`
- Update all URLs with your server IP

### 2️⃣ Run Deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

### 3️⃣ Access Application

```
Web:  http://YOUR_IP:3000
API:  http://YOUR_IP:3001/api/docs
```

**Login:** admin@gps-free-saas.com / admin123

---

## Quick Commands

```bash
make status     # Check all services
make logs       # View logs
make restart    # Restart services
make backup     # Backup database
```

---

## Need Help?

```bash
./diagnose.sh   # Run diagnostics
make logs       # Check logs
cat README.md   # Full documentation
```

---

**That's it! You're live! 🎉**

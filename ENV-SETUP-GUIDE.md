# 📝 .env FILE SETUP GUIDE

## Step-by-Step Configuration

### 1️⃣ Get Your Server IP

```bash
# On your server, run:
curl ifconfig.me
```

Note this IP address (e.g., `3.108.114.12`)

---

### 2️⃣ Generate Secure Secrets

Run these commands on your server:

```bash
# Generate DB_PASSWORD (copy the output)
openssl rand -base64 24

# Generate JWT_SECRET (copy the output)
openssl rand -base64 32

# Generate GPS_SERVER_KEY (copy the output)
openssl rand -base64 32
```

**Save these outputs somewhere safe!**

---

### 3️⃣ Get Gmail App Password

1. Go to: https://myaccount.google.com/security
2. Enable **2-Factor Authentication** (if not already enabled)
3. Go to: https://myaccount.google.com/apppasswords
4. Select **"Mail"** and **"Other (Custom name)"**
5. Enter name: **"GPS Tracking System"**
6. Click **"Generate"**
7. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

---

### 4️⃣ Edit the .env File

```bash
cd gps-saas-FIXED-FINAL
nano .env
```

Change these values:

```bash
# 1. Database password (use output from step 2)
DB_PASSWORD=<paste your generated password>

# 2. JWT secret (use output from step 2)
JWT_SECRET=<paste your generated secret>

# 3. GPS server key (use output from step 2)
GPS_SERVER_KEY=<paste your generated key>

# 4. Gmail settings (use info from step 3)
SMTP_USER=your-email@gmail.com
SMTP_PASS=<paste your Gmail app password>

# 5. Server URLs (use IP from step 1)
FRONTEND_URL=http://YOUR_IP:3000
NEXT_PUBLIC_API_URL=http://YOUR_IP:3001
NEXT_PUBLIC_WS_URL=ws://YOUR_IP:3001
```

**Example with real IP (3.108.114.12):**
```bash
FRONTEND_URL=http://3.108.114.12:3000
NEXT_PUBLIC_API_URL=http://3.108.114.12:3001
NEXT_PUBLIC_WS_URL=ws://3.108.114.12:3001
```

---

### 5️⃣ Save the File

Press `Ctrl+X`, then `Y`, then `Enter`

---

### 6️⃣ Verify Configuration

```bash
# Check your .env file
cat .env | grep -E "(DB_PASSWORD|JWT_SECRET|SMTP_USER|FRONTEND_URL)"

# Make sure no line shows "CHANGE" or "your-" or "localhost"
```

---

## ✅ Complete Example

Here's what your .env should look like (with your own values):

```bash
# Database
DB_PASSWORD=Xy9kL2mN4pQ6rS8tU0vW
DATABASE_URL=postgresql://gpsadmin:${DB_PASSWORD}@postgres:5432/gpstrack

# JWT
JWT_SECRET=aB3cD5eF7gH9iJ1kL3mN5oP7qR9sT1uV3wX5yZ7

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=john.doe@gmail.com
SMTP_PASS=abcd efgh ijkl mnop

# GPS Server
GPS_SERVER_KEY=bC4dE6fG8hI0jK2lM4nO6pQ8rS0tU2vW4xY6zA8

# Frontend URLs (with YOUR server IP)
FRONTEND_URL=http://3.108.114.12:3000
NEXT_PUBLIC_API_URL=http://3.108.114.12:3001
NEXT_PUBLIC_WS_URL=ws://3.108.114.12:3001

# Optional
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
DOMAIN=yourdomain.com

# Ports
GPS_GT06_PORT=5000
GPS_TK103_PORT=5001
GPS_H02_PORT=5002

# Environment
NODE_ENV=production
```

---

## 🚨 Common Mistakes

❌ **Don't do this:**
```bash
DB_PASSWORD=CHANGE_THIS                    # Still has placeholder
JWT_SECRET=your-secret-here                # Not secure
FRONTEND_URL=http://localhost:3000         # Still localhost
SMTP_PASS=myregularpassword                # Not app password
```

✅ **Do this:**
```bash
DB_PASSWORD=Xy9kL2mN4pQ6rS8tU0vW          # Random generated
JWT_SECRET=aB3cD5eF7gH9iJ1kL3mN5oP7qR9sT  # Random 32+ chars
FRONTEND_URL=http://3.108.114.12:3000      # Your actual IP
SMTP_PASS=abcd efgh ijkl mnop              # Gmail app password
```

---

## 🔐 Security Tips

1. **Never use these example values** - Generate your own!
2. **Keep .env file secure** - Don't share or commit to Git
3. **Use strong passwords** - Minimum 12 characters
4. **Generate random secrets** - Use `openssl rand -base64 32`
5. **Gmail app passwords only** - Don't use regular password

---

## 🆘 Troubleshooting

### Error: "Variable not set"

**Problem:** Deployment fails saying environment variables not set

**Solution:**
```bash
# Check for missing values
cat .env | grep "CHANGE\|your-\|localhost"

# If you see any matches, edit those lines
nano .env
```

### Error: "Invalid credentials"

**Problem:** Email notifications fail

**Solution:**
- Make sure you're using Gmail **app password**, not regular password
- Regenerate app password if needed
- Check SMTP_USER is your full email address

### Error: "Database connection failed"

**Problem:** Can't connect to database

**Solution:**
- Check DB_PASSWORD has no quotes or special characters
- Make sure DATABASE_URL uses `${DB_PASSWORD}` variable
- Don't change the database URL format

---

## ✅ Validation Checklist

Before deploying, verify:

- [ ] DB_PASSWORD changed (no "CHANGE" text)
- [ ] JWT_SECRET is 32+ random characters
- [ ] GPS_SERVER_KEY is 32+ random characters
- [ ] SMTP_USER is your Gmail address
- [ ] SMTP_PASS is Gmail app password (16 chars)
- [ ] FRONTEND_URL has your server IP (no localhost)
- [ ] NEXT_PUBLIC_API_URL has your server IP (no localhost)
- [ ] NEXT_PUBLIC_WS_URL has your server IP (no localhost)
- [ ] All three URLs use same IP address
- [ ] No placeholder text remains

---

## 🚀 After Configuration

Once your .env is configured:

```bash
# Deploy!
./deploy.sh
```

The deployment script will validate your configuration before building.

---

## 📞 Need Help?

If you're stuck:

1. **Check examples above** - Compare with your .env
2. **Run diagnostics** - `./diagnose.sh`
3. **Verify values** - Make sure all placeholders are replaced
4. **Test each component** - Database, JWT, SMTP separately

---

**Your .env file is the heart of your configuration. Take 5 minutes to do it right! ⚡**

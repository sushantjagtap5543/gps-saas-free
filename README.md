# 🛰️ GPS-Free-SaaS

**Zero-cost, self-hosted GPS tracking platform for AWS Lightsail 2GB**

[![Deploy Free](https://img.shields.io/badge/Deploy-AWS%20Lightsail-FF9900?logo=amazon-aws)](https://aws.amazon.com/lightsail/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 What's Included

- ✅ **Custom GPS Server** (No Traccar needed - built-in TCP/UDP parser)
- ✅ **Free Maps** (Leaflet + OpenStreetMap - no Google Maps API key)
- ✅ **Real-time Tracking** (WebSocket live updates)
- ✅ **Geofencing** with alerts
- ✅ **Role-based Dashboards** (Admin + Client)
- ✅ **Alert Notification Control** (Admin configures, Client receives)
- ✅ **Trip History & Reports**
- ✅ **Mobile-responsive UI**

## 💰 Total Cost: ~$10/month (AWS Lightsail 2GB)

**No paid APIs required. Everything is self-hosted.**

---

## 🚀 Quick Deploy (15 minutes)

### Step 1: AWS Lightsail Setup

```bash
# 1. Create Lightsail Instance
# OS: Ubuntu 22.04 LTS
# Plan: 2GB RAM, 1 vCPU, 60GB SSD ($10/month)
# Enable: Static IP

# 2. Connect via SSH
ssh ubuntu@YOUR_STATIC_IP

# 3. Update system
sudo apt update && sudo apt upgrade -y

# 4. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# 5. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose 

Markdown
Copy
Code
Preview
<p align="center">
  <img src="https://via.placeholder.com/150?text=GPS" alt="GPS Free SaaS Logo" width="150" height="150"/>
</p>

<h1 align="center">🛰️ GPS-Free-SaaS</h1>

<p align="center">
  <strong>Zero-Cost, Self-Hosted GPS Fleet Management Platform</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-deploy">Deploy</a> •
  <a href="#-api-documentation">API</a> •
  <a href="#-user-manual">Manual</a> •
  <a href="#-troubleshooting">Help</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/100%25-Free-brightgreen" alt="100% Free"/>
  <img src="https://img.shields.io/badge/AWS-Lightsail-FF9900?logo=amazon-aws" alt="AWS Lightsail"/>
  <img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker" alt="Docker"/>
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License"/>
</p>

---

## 📋 Table of Contents

1. [Features](#-features)
2. [System Requirements](#-system-requirements)
3. [Quick Deploy (15 Minutes)](#-quick-deploy-15-minutes)
4. [Default Credentials](#-default-credentials)
5. [Port Configuration](#-port-configuration)
6. [API Documentation](#-api-documentation)
7. [First-Time User Manual](#-first-time-user-manual)
8. [GPS Device Setup](#-gps-device-setup)
9. [Troubleshooting](#-troubleshooting)
10. [Backup & Maintenance](#-backup--maintenance)

---

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🗺️ **Free Maps** | OpenStreetMap + Leaflet (No API key needed) | ✅ |
| 📡 **GPS Protocols** | GT06, TK103, H02 built-in support | ✅ |
| 🔔 **Real-time Alerts** | WebSocket + Email notifications | ✅ |
| 🚧 **Geofencing** | Circle/Polygon zones with alerts | ✅ |
| 👥 **Role-Based Access** | Admin + Client dashboards | ✅ |
| 📱 **Mobile Responsive** | Works on all devices | ✅ |
| 🔒 **100% Self-Hosted** | No third-party dependencies | ✅ |
| 💰 **Zero Cost** | No paid APIs or services required | ✅ |

---

## 💻 System Requirements

### Minimum (Development)
- **RAM**: 1 GB
- **CPU**: 1 core
- **Storage**: 10 GB
- **OS**: Any with Docker support

### Recommended (Production)
- **RAM**: 2 GB
- **CPU**: 1-2 cores
- **Storage**: 20 GB SSD
- **OS**: Ubuntu 22.04 LTS

### AWS Lightsail Recommended Plan
- **Plan**: 2GB RAM, 1 vCPU, 60GB SSD
- **Cost**: ~$10/month
- **OS**: Ubuntu 22.04 LTS

---

## 🚀 Quick Deploy (15 Minutes)

### Step 1: Create AWS Lightsail Instance

```bash
# 1. Login to AWS Lightsail Console
# 2. Click "Create Instance"
# 3. Select: Ubuntu 22.04 LTS
# 4. Select: 2GB RAM, 1 vCPU, 60GB SSD ($10/month)
# 5. Name: gps-saas-server
# 6. Click "Create Instance"

# 7. Attach Static IP (IMPORTANT!)
#    - Go to Networking tab
#    - Click "Create static IP"
#    - Attach to your instance
Step 2: Connect and Setup
bash
Copy
# SSH into your instance (replace with your static IP)
ssh ubuntu@YOUR_STATIC_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
Step 3: Deploy Application
bash
Copy
# Create application directory
mkdir -p /opt/gps && cd /opt/gps

# Option A: Clone from GitHub (if you pushed to repo)
git clone https://github.com/yourusername/gps-free-saas.git .

# Option B: Upload files via SCP from local machine
# From your local machine:
# scp -r gps-free-saas/* ubuntu@YOUR_STATIC_IP:/opt/gps/

# Configure environment
cp infra/.env.example infra/.env
nano infra/.env

# Edit these values in .env:
# DB_PASSWORD=your_secure_password_here
# JWT_SECRET=$(openssl rand -base64 32)
# SMTP_USER=your.email@gmail.com
# SMTP_PASS=your_gmail_app_password
Step 4: Start Services
bash
Copy
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Or use Make (if installed):
make deploy

# Check status
docker-compose ps

# View logs
docker-compose logs -f
Step 5: Verify Deployment
bash
Copy
# Test API health
curl http://localhost:3001/health

# Should return: {"status":"ok","timestamp":"..."}

# Check all services
docker-compose ps

# Expected output:
# NAME                STATUS          PORTS
# gps_postgres_1      Up (healthy)    5432/tcp
# gps_redis_1         Up              6379/tcp
# gps_backend_1       Up              0.0.0.0:3001->3001/tcp
# gps_web_1           Up              0.0.0.0:3000->3000/tcp
# gps_gps-server_1    Up              0.0.0.0:5000-5002->5000-5002/tcp, 4000/tcp
Step 6: Open Firewall Ports
bash
Copy
# In AWS Lightsail Console:
# 1. Go to your instance
# 2. Click "Networking" tab
# 3. Add these firewall rules:

# IPv4 Firewall:
# - Application: Custom
# - Protocol: TCP
# - Port: 80 (HTTP)
# - Restrict: No

# - Application: Custom
# - Protocol: TCP
# - Port: 443 (HTTPS)
# - Restrict: No

# - Application: Custom
# - Protocol: TCP
# - Port: 3000 (Web App)
# - Restrict: No

# - Application: Custom
# - Protocol: TCP
# - Port: 3001 (API)
# - Restrict: No (or your IP only)

# - Application: Custom
# - Protocol: TCP
# - Port: 5000-5002 (GPS Devices)
# - Restrict: No (or device IPs only)

# SSH is already open (port 22)
🔑 Default Credentials
First Login Credentials
Table
Role	Email	Password	Access Level
Super Admin	admin@gps.com	admin123	Full system control
Demo Client	client@demo.com	client123	Own vehicles only
API Authentication
bash
Copy
# Get JWT Token
curl -X POST http://YOUR_IP:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gps.com","password":"admin123"}'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "admin@gps.com",
    "name": "System Administrator",
    "role": "ADMIN"
  }
}

# Use token in subsequent requests:
curl http://YOUR_IP:3001/api/admin/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
🔌 Port Configuration
External Ports (Open in Firewall)
Table
Port	Service	Purpose	Who Needs Access
22	SSH	Server management	You only
80	HTTP	Web redirect	Public
443	HTTPS	Secure web (optional)	Public
3000	Next.js	Web application	Public
3001	NestJS	API server	Public/Your IP
5000	GPS Server	GT06 protocol devices	GPS devices
5001	GPS Server	TK103 protocol devices	GPS devices
5002	GPS Server	H02 protocol devices	GPS devices
Internal Ports (Docker Network)
Table
Port	Service	Container
5432	PostgreSQL	postgres
6379	Redis	redis
4000	GPS WebSocket	gps-server
Port URLs
plain
Copy
Web Application:    http://YOUR_IP:3000
API Documentation:  http://YOUR_IP:3001/api/docs
API Endpoint:       http://YOUR_IP:3001/api
WebSocket:          ws://YOUR_IP:3001/notifications
GPS GT06:           tcp://YOUR_IP:5000
GPS TK103:          tcp://YOUR_IP:5001
GPS H02:            tcp://YOUR_IP:5002
📚 API Documentation
Authentication Endpoints
Table
Method	Endpoint	Description	Auth Required
POST	/api/auth/login	Login user	No
POST	/api/auth/register	Register new user	No
GET	/api/auth/me	Get current user	Yes
Vehicle Endpoints
Table
Method	Endpoint	Description	Auth Required
GET	/api/vehicles	List vehicles	Yes
GET	/api/vehicles/:id	Get vehicle details	Yes
GET	/api/vehicles/:id/history	Get position history	Yes
POST	/api/vehicles	Create vehicle	Yes (Admin)
PUT	/api/vehicles/:id	Update vehicle	Yes
DELETE	/api/vehicles/:id	Delete vehicle	Yes (Admin)
Geofence Endpoints
Table
Method	Endpoint	Description	Auth Required
GET	/api/geofences	List geofences	Yes
POST	/api/geofences	Create geofence	Yes
POST	/api/geofences/:id/assign	Assign vehicle	Yes
DELETE	/api/geofences/:id	Delete geofence	Yes
Alert Endpoints
Table
Method	Endpoint	Description	Auth Required
GET	/api/alerts	Get my alerts	Yes
GET	/api/alerts/unread-count	Get unread count	Yes
PUT	/api/alerts/:id/read	Mark as read	Yes
PUT	/api/alerts/read-all	Mark all read	Yes
GET	/api/alerts/config	Get alert config	Yes (Admin)
PUT	/api/alerts/config/:type	Update config	Yes (Admin)
Admin Endpoints
Table
Method	Endpoint	Description	Auth Required
GET	/api/admin/dashboard	Dashboard stats	Yes (Admin)
GET	/api/admin/users	List all users	Yes (Admin)
POST	/api/admin/users	Create user	Yes (Admin)
PUT	/api/admin/users/:id	Update user	Yes (Admin)
DELETE	/api/admin/users/:id	Delete user	Yes (Admin)
GET	/api/admin/settings	Get settings	Yes (Admin)
PUT	/api/admin/settings	Update settings	Yes (Admin)
Example API Calls
bash
Copy
# 1. Login
TOKEN=$(curl -s -X POST http://YOUR_IP:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gps.com","password":"admin123"}' | \
  jq -r '.access_token')

# 2. Get dashboard stats
curl http://YOUR_IP:3001/api/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"

# 3. List all vehicles
curl http://YOUR_IP:3001/api/vehicles \
  -H "Authorization: Bearer $TOKEN"

# 4. Create new vehicle
curl -X POST http://YOUR_IP:3001/api/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Truck 1",
    "plateNumber": "ABC123",
    "imei": "123456789012345",
    "protocol": "gt06",
    "userId": "client-user-uuid"
  }'

# 5. Get vehicle history (last 24 hours)
curl "http://YOUR_IP:3001/api/vehicles/VEHICLE_ID/history?hours=24" \
  -H "Authorization: Bearer $TOKEN"

# 6. Create geofence
curl -X POST http://YOUR_IP:3001/api/geofences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Zone",
    "type": "CIRCLE",
    "coordinates": {
      "center": {"lat": 19.0760, "lng": 72.8777},
      "radius": 500
    },
    "alertOnEnter": true,
    "alertOnExit": true
  }'
📖 First-Time User Manual
Step 1: Access the Platform
plain
Copy
1. Open browser: http://YOUR_STATIC_IP:3000
2. You should see the landing page
3. Click "Sign In" or go directly to http://YOUR_IP:3000/login
Step 2: Login as Admin
plain
Copy
Email:    admin@gps.com
Password: admin123

⚠️ IMPORTANT: Change this password immediately after first login!
Step 3: Change Admin Password
plain
Copy
1. Go to: Admin Panel → Settings → Security
2. Click "Change Password"
3. Enter current password: admin123
4. Enter new secure password
5. Save changes
Step 4: Create Your First Client
plain
Copy
1. Go to: Admin Panel → Users
2. Click "Add User"
3. Fill details:
   - Name: Client Company Name
   - Email: client@company.com
   - Password: temporarypassword123
   - Role: CLIENT
   - Max Vehicles: 10
4. Click "Create User"
5. Share credentials with client
Step 5: Add a Vehicle
plain
Copy
1. Go to: Admin Panel → All Vehicles
2. Click "Add Vehicle"
3. Fill details:
   - Name: Truck 1
   - Plate Number: ABC-123
   - IMEI: (15-digit device IMEI)
   - Protocol: gt06 (or tk103/h02)
   - Assign to: Select client from dropdown
4. Save

Note: Vehicle will appear "Offline" until physical device connects
Step 6: Configure GPS Device
plain
Copy
Physical Device Setup:
1. Insert active SIM card with data plan
2. Power on device
3. Send SMS commands to configure:

For GT06 devices:
  apn,your_carrier_apn#
  adminip,YOUR_STATIC_IP,5000#
  t030s***n123456# (30 second interval)

For TK103 devices:
  apn123456 your_carrier_apn
  adminip123456 YOUR_STATIC_IP 5000
  t030s123456

Wait 2-3 minutes for device to connect
Step 7: Verify Device Connection
plain
Copy
1. Check GPS Server logs:
   docker-compose logs -f gps-server

2. Look for: "Device connected" and "Decoded position" messages

3. In web app, vehicle should show:
   - Status: Online (green dot)
   - Current location on map
   - Speed updates every 30 seconds
Step 8: Create Geofence Alert
plain
Copy
1. Login as Client (or stay as Admin)
2. Go to: Client Panel → Geofences
3. Click "Create Geofence"
4. Enter:
   - Name: "Office Area"
   - Type: Circle
   - Radius: 500 meters
   - Enable "Enter alerts" and "Exit alerts"
5. Save

6. Go to geofence details
7. Click "Assign Vehicles"
8. Select vehicles to monitor
9. Save

Now you'll get alerts when vehicles enter/exit the zone!
Step 9: Configure Alert Notifications (Admin)
plain
Copy
1. Go to: Admin Panel → Alert Config
2. Review each alert type:
   - OVERSPEED: Set speed limit (e.g., 80 km/h)
   - GEOFENCE_ENTER/EXIT: Enable as needed
   - DEVICE_OFFLINE: Set timeout (e.g., 5 minutes)

3. For each alert, configure:
   - Enable/Disable
   - Notify Admin: Yes/No
   - Notify Client: Yes/No
   - Channels: WebSocket, Email

4. Save settings
Step 10: Client Dashboard Walkthrough
plain
Copy
As Client (client@demo.com / client123):

1. Dashboard: See fleet overview with stats
2. Live Map: Real-time vehicle tracking
   - Click vehicle to center map
   - Green = Moving, Yellow = Idle, Red = Offline
3. My Vehicles: List all vehicles with details
   - Click "Track Live" to see on map
   - Click "History" to see past trips
4. Geofences: Manage your zones
5. Alerts: View notification history
6. Settings: Update profile, notification preferences
📡 GPS Device Setup
Supported Devices & Protocols
Table
Brand	Model	Protocol	Port	SMS Config
Concox	GT06N, GT06E	GT06	5000	adminip123456 IP 5000
Meitrack	MVT380, T1	GT06	5000	IP:PORT:APN
Coban	TK103, TK103B	TK103	5001	adminip123456 IP 5000
Xexun	XT009, XT011	TK103	5001	adminip123456 IP 5000
Queclink	GV300W	TK103	5001	AT+GTSRI=...
Generic	H02 clones	H02	5002	pw,123456,ip,IP,5000#
Finding Your Device IMEI
plain
Copy
Method 1: Check device label (usually 15 digits)
Method 2: Send SMS: imei123456 (or imei#)
Method 3: Check device box/documentation
APN Configuration by Carrier
Table
Country	Carrier	APN
India	Jio	jionet
India	Airtel	airtelgprs.com
India	Vodafone	www
USA	T-Mobile	fast.t-mobile.com
USA	AT&T	broadband
UK	EE	everywhere
UK	Vodafone	internet
Testing Device Connection
bash
Copy
# On server, monitor GPS logs
docker-compose logs -f gps-server

# You should see:
# [GT06] Device connected: 203.192.x.x:xxxxx
# [GT06] Decoded: { imei: '123456789012345', ... }

# If no connection after 5 minutes:
# 1. Check SIM has data balance
# 2. Verify APN is correct
# 3. Check firewall allows device IP
# 4. Ensure device has GPS fix (outdoor)
🔧 Troubleshooting
Common Issues & Solutions
Issue 1: Cannot access web application
bash
Copy
# Check if containers are running
docker-compose ps

# Check web container logs
docker-compose logs web

# Verify port 3000 is open
sudo netstat -tlnp | grep 3000

# Restart web service
docker-compose restart web
Issue 2: Login fails with "Invalid credentials"
bash
Copy
# Reset admin password
docker-compose exec backend node -e "
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('admin123', 10);
console.log('Password hash:', hash);
"

# Then update in database:
docker-compose exec postgres psql -U gpsadmin -d gpstrack -c "
UPDATE users SET password = 'HASH_FROM_ABOVE' WHERE email = 'admin@gps.com';
"
Issue 3: GPS device not connecting
bash
Copy
# Check GPS server is listening
sudo netstat -tlnp | grep 5000

# Check firewall
sudo ufw status
sudo ufw allow 5000:5002/tcp

# Monitor logs
docker-compose logs -f gps-server

# Test with netcat (from another machine)
nc -vz YOUR_IP 5000
Issue 4: No email alerts
bash
Copy
# Test SMTP configuration
docker-compose exec backend node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your.email@gmail.com',
    pass: 'your_app_password'
  }
});
transporter.verify().then(() => console.log('SMTP OK')).catch(console.error);
"

# For Gmail, must use "App Password" not regular password
# Enable 2FA on Google account, then generate app password
Issue 5: Database connection errors
bash
Copy
# Check PostgreSQL is healthy
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Reset database (WARNING: deletes all data!)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
Issue 6: High memory usage on 2GB server
bash
Copy
# Add memory limits to docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
  
  web:
    deploy:
      resources:
        limits:
          memory: 256M

# Restart with limits
docker-compose up -d
Getting Help
Table
Resource	Link/Command
View all logs	docker-compose logs -f
Check service status	docker-compose ps
API documentation	http://YOUR_IP:3001/api/docs
Restart all services	docker-compose restart
GitHub Issues	https://github.com/yourusername/gps-free-saas/issues
💾 Backup & Maintenance
Automated Daily Backups
bash
Copy
# Add to crontab
crontab -e

# Add this line for daily backup at 2 AM:
0 2 * * * cd /opt/gps && /usr/local/bin/docker-compose exec -T postgres pg_dump -U gpsadmin gpstrack | gzip > /opt/gps/backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz

# Create backup directory
mkdir -p /opt/gps/backups
Manual Backup
bash
Copy
# Database backup
docker-compose exec postgres pg_dump -U gpsadmin gpstrack > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Make command
make backup
Restore from Backup
bash
Copy
# Stop services
docker-compose down

# Start only database
docker-compose up -d postgres

# Wait for database ready
sleep 5

# Restore backup
gunzip < backup_20240115_120000.sql.gz | docker-compose exec -T postgres psql -U gpsadmin -d gpstrack

# Start all services
docker-compose up -d
Update Application
bash
Copy
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Or use Make
make deploy
System Maintenance Commands
bash
Copy
# View disk usage
df -h

# View memory usage
free -h

# Clean Docker system
docker system prune -f

# View container stats
docker stats

# Restart specific service
docker-compose restart backend
📜 License
This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments
OpenStreetMap - Free maps
Leaflet - JavaScript mapping library
NestJS - Backend framework
Next.js - Frontend framework
shadcn/ui - UI components
<p align="center">
  <strong>Built with ❤️ for the open-source community</strong>
</p>
<p align="center">
  <a href="https://github.com/yourusername/gps-free-saas">⭐ Star this repo if you find it helpful!</a>
</p>
```
📊 README.md Summary
Table
Section	Purpose	Lines
Features	Showcase capabilities	15
System Requirements	Hardware specs	20
Quick Deploy	15-minute setup guide	80
Default Credentials	Login info	15
Port Configuration	Firewall & networking	30
API Documentation	Complete endpoint reference	60
First-Time User Manual	Step-by-step walkthrough	100
GPS Device Setup	Hardware configuration	40
Troubleshooting	Common issues & fixes	50
Backup & Maintenance	Operations guide	30
TOTAL		~440 lines
This README provides everything needed for:
✅ First-time deployment
✅ Daily operations
✅ API integration
✅ Troubleshooting
✅ User onboarding

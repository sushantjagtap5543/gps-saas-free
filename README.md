# 🛰️ GPS-Free-SaaS

Zero-cost, self-hosted GPS tracking platform for AWS Lightsail 2GB

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-Lightsail-FF9900?logo=amazon-aws)](https://aws.amazon.com/lightsail/)

## 🎯 What's Included

- ✅ **Custom GPS Server** - Built-in TCP/UDP parser (No Traccar needed)
- ✅ **Free Maps** - Leaflet + OpenStreetMap (No Google Maps API key)
- ✅ **Real-time Tracking** - WebSocket live updates
- ✅ **Geofencing** - Circle/Polygon zones with alerts
- ✅ **Role-based Dashboards** - Admin + Client access
- ✅ **Alert Notifications** - WebSocket, Email, Push
- ✅ **Trip History & Reports** - Complete tracking history
- ✅ **Mobile Responsive** - Works on all devices

## 💰 Total Cost

**~$10/month** (AWS Lightsail 2GB) - No paid APIs required. Everything is self-hosted.

## 🚀 Quick Deploy (15 minutes)

### Step 1: AWS Lightsail Setup

1. **Create Lightsail Instance**
   - OS: Ubuntu 22.04 LTS
   - Plan: 2GB RAM, 1 vCPU, 60GB SSD ($10/month)
   - Enable: Static IP

2. **Connect via SSH**
   ```bash
   ssh ubuntu@YOUR_STATIC_IP
   ```

3. **Update system**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker ubuntu
   newgrp docker
   ```

5. **Install Docker Compose**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

### Step 2: Deploy Application

1. **Clone repository**
   ```bash
   git clone https://github.com/sushantjagtap5543/gps-saas-free.git
   cd gps-saas-free
   ```

2. **Configure environment**
   ```bash
   cp infra/.env.example infra/.env
   nano infra/.env
   ```

3. **Edit these values in `.env`:**
   ```bash
   DB_PASSWORD=your_secure_password_here
   JWT_SECRET=$(openssl rand -base64 32)
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=your_gmail_app_password
   GPS_SERVER_KEY=$(openssl rand -base64 32)
   ```

4. **Start services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

5. **Check status**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

### Step 3: Open Firewall Ports

In AWS Lightsail Console:
1. Go to your instance
2. Click "Networking" tab
3. Add these firewall rules:

| Application | Protocol | Port | Restrict |
|-------------|----------|------|----------|
| Custom | TCP | 80 | No |
| Custom | TCP | 443 | No |
| Custom | TCP | 3000 | No |
| Custom | TCP | 3001 | Your IP only |
| Custom | TCP | 5000-5002 | Device IPs only |

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@gps.com | admin123 |
| Demo Client | client@demo.com | client123 |

**⚠️ Change these immediately after first login!**

## 📁 Project Structure

```
gps-saas-free/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── modules/   # Auth, Users, Vehicles, etc.
│   │   ├── common/    # Prisma service
│   │   └── ...
│   ├── prisma/        # Database schema
│   └── Dockerfile
├── frontend/          # Next.js React app
│   ├── src/
│   └── Dockerfile
├── gps-server/        # GPS TCP/UDP server
│   ├── src/
│   │   └── parsers/   # GT06, TK103, H02
│   └── Dockerfile
├── infra/             # Infrastructure config
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.prod.yml
└── Makefile
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Local Setup

```bash
# Install dependencies
make install

# Start development servers
make dev

# Or start with Docker
make deploy
```

### Available Commands

```bash
make help       # Show all commands
make install    # Install dependencies
make dev        # Start development
make build      # Build production images
make deploy     # Deploy to production
make logs       # View logs
make backup     # Create database backup
make clean      # Clean up containers
```

## 📡 GPS Device Setup

### Supported Protocols

| Protocol | Port | Devices |
|----------|------|---------|
| GT06 | 5000 | GT06, GT06N, JV200 |
| TK103 | 5001 | TK103, TK103B, GPS103 |
| H02 | 5002 | H02, JT600, GT02 |

### Device Configuration

Configure your GPS device to send data to:
- **Server IP**: Your AWS Lightsail Static IP
- **Port**: Based on your device protocol (5000, 5001, or 5002)
- **APN**: Your SIM card provider's APN

Example SMS commands for GT06:
```
# Set server IP and port
SERVER,0,YOUR_IP,5000,0#

# Check status
STATUS#
```

## 🔒 Security

- Change default passwords immediately
- Use strong JWT_SECRET and GPS_SERVER_KEY
- Restrict port 3001 to your IP only
- Enable HTTPS in production
- Regularly update dependencies

## 🐛 Troubleshooting

### Services not starting
```bash
docker-compose logs [service-name]
```

### Database connection issues
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U gpsadmin

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### GPS data not received
```bash
# Check GPS server logs
docker-compose logs gps-server

# Test port connectivity
telnet YOUR_IP 5000
```

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email sushantjagtap5543@gmail.com or open an issue on GitHub.

---

**Made with ❤️ for the GPS tracking community**

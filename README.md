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

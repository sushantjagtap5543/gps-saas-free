#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/sushantjagtap5543/gps-saas-free.git"
APP_DIR="/opt/gps-saas-free"

echo "==> Updating system..."
sudo apt update -y
sudo apt upgrade -y

echo "==> Installing base tools..."
sudo apt install -y curl git

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker "$USER" || true
fi

echo "==> Installing Docker Compose v2..."
if ! command -v docker-compose >/dev/null 2>&1; then
  sudo curl -L \
    "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

echo "==> Creating application directory..."
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "==> Pulling latest changes..."
  cd "$APP_DIR"
  git pull origin main
fi

cd "$APP_DIR"

echo "==> Preparing environment file..."
if [ ! -f infra/.env ]; then
  cp infra/.env.example infra/.env

  # generate secure secrets if placeholders present
  JWT_SECRET_GEN=$(openssl rand -base64 32)
  GPS_SERVER_KEY_GEN=$(openssl rand -base64 32)

  sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET_GEN}|g" infra/.env
  sed -i "s|GPS_SERVER_KEY=.*|GPS_SERVER_KEY=${GPS_SERVER_KEY_GEN}|g" infra/.env

  # You MUST edit DB_PASSWORD, SMTP_USER, SMTP_PASS manually after first run.
  echo "==> IMPORTANT: Edit infra/.env to set DB_PASSWORD, SMTP_USER, SMTP_PASS."
fi

echo "==> Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "==> Current containers status:"
docker-compose -f docker-compose.prod.yml ps

echo "==> Basic health logs (last 50 lines for main services)..."
docker-compose -f docker-compose.prod.yml logs --tail=50 backend frontend gps-server postgres redis

echo "==> Deployment finished."
echo "Frontend: http://YOUR_STATIC_IP"
echo "Admin login: admin@gps.com / admin123  (change immediately)"

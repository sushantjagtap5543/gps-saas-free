#!/bin/bash
set -e

echo "🚀 Deploying GPS-Free-SaaS..."

# Pull latest changes
git pull origin main

# Build and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Cleanup
docker system prune -f

echo "✅ Deployment complete!"
echo "📊 Check status: docker-compose ps"
echo "📝 View logs: docker-compose logs -f"

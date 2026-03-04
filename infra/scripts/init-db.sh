#!/bin/bash
set -e

echo "🚀 Initializing GPS-Free-SaaS Database..."

# Wait for PostgreSQL
until pg_isready -h postgres -U gpsadmin; do
  echo "⏳ Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run migrations
cd /app
npx prisma migrate deploy

# Seed database
npx prisma db seed

echo "✅ Database initialization complete!"

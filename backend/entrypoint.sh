#!/bin/sh
set -e

echo "🚀 Starting GPS-FREE-SAAS Backend..."

# Wait a bit for database
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy || {
  echo "⚠️  Migration warning (may be first run)"
}

# Try to seed database (skip if already seeded)
echo "🌱 Seeding database..."
npx prisma db seed 2>/dev/null || {
  echo "   Seed skipped (likely already seeded or no seed file)"
}

# Start the application
echo "✅ Starting NestJS application..."
exec node dist/main.js

# =========================
# Builder Stage
# =========================
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build


# =========================
# Production Stage
# =========================
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies (for healthcheck)
RUN apk add --no-cache curl

ENV NODE_ENV=production

# Copy only production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

# Copy built app
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh

# Create non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Change ownership
RUN chown -R nodejs:nodejs /app && chmod +x /app/entrypoint.sh
USER nodejs

EXPOSE 3001

# Health check (make sure /health exists in your app)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application with proper error handling and migration
CMD ["/app/entrypoint.sh"]

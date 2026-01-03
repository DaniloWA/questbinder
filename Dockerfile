# ============================================
# 🎲 QUESTBINDER - Dockerfile
# ============================================
# Multi-stage build:
#   Stage 1: Build frontend with Vite
#   Stage 2: Production server with Node.js
# ============================================

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy frontend source
COPY client/ ./

# Build frontend for production
RUN npm run build

# ============================================
# Stage 2: Production Server
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install sqlite3 build dependencies (needed for native module)
RUN apk add --no-cache python3 make g++ sqlite

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server source files
COPY server/ ./

# Copy built frontend from stage 1
WORKDIR /app
COPY --from=frontend-builder /app/client/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment variables (can be overridden in docker-compose)
ENV NODE_ENV=production
ENV PORT=3002
ENV HOST=0.0.0.0

# Expose ports
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/campaigns || exit 1

# Start server
WORKDIR /app/server
CMD ["node", "index.js"]

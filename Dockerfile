# ============================================
# Multi-stage Dockerfile for AWS EC2 Production
# ============================================

# ---------- STAGE 1: Frontend Build ----------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Enable pnpm
RUN corepack enable

# Copy frontend package files
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN pnpm run build

# ---------- STAGE 2: Backend Build ----------
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy root package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy backend source and configs
COPY backend/ ./backend/
COPY tsconfig.server.json ./

# Generate Prisma Client
RUN pnpm exec prisma generate

# Build backend TypeScript
RUN pnpm run build:server

# ---------- STAGE 3: Production Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Install production dependencies
RUN corepack enable && \
    apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy root package files and install prod dependencies only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy Prisma schema and generate client
COPY backend/prisma ./backend/prisma
RUN pnpm exec prisma generate

# Copy compiled backend from builder
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/dist ./backend/dist

# Copy built frontend from builder
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Create upload directories with proper permissions
RUN mkdir -p /app/backend/public/uploads/vehicles \
             /app/backend/public/uploads/drivers && \
    chown -R nodejs:nodejs /app

# Copy backend public assets if any
COPY --chown=nodejs:nodejs backend/public ./backend/public

# Switch to non-root user
USER nodejs

# Environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    NODE_OPTIONS="--max-old-space-size=512"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run migrations and start server
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node backend/dist/server.js"]
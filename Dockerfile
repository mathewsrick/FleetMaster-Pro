# ============================================
# STAGE 1: Build Frontend & Backend
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Habilitar pnpm
RUN corepack enable

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar todo el código fuente
COPY . .

# Generar Prisma Client
RUN pnpm prisma:generate

# Build frontend y backend
# RUN pnpm run build

# ============================================
# STAGE 2: Production Runtime
# ============================================
FROM node:20-alpine

WORKDIR /app

# Instalar solo producción
RUN corepack enable

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Copiar Prisma schema y migraciones
COPY backend/prisma ./backend/prisma

# Generar Prisma Client en producción
# RUN pnpm prisma:generate

# Copiar builds desde builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend/dist ./backend/dist

# Crear directorio para uploads
RUN mkdir -p /app/backend/public/uploads/vehicles /app/backend/public/uploads/drivers

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Ejecutar migraciones y luego iniciar servidor
CMD pnpm prisma:migrate && node backend/dist/server.js

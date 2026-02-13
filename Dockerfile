# ============================================
# FleetMaster Hub - Production Image
# ============================================

FROM node:20-alpine

WORKDIR /app

# Habilitar pnpm
RUN corepack enable

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile --ignore-scripts=false

# Copiar Prisma schema (necesario para migraciones si las usas manualmente)
COPY backend/prisma ./backend/prisma

# Copiar builds generados LOCALMENTE
COPY dist ./dist
COPY backend/dist ./backend/dist

# Crear directorios para uploads persistentes
RUN mkdir -p /app/backend/public/uploads/vehicles \
    /app/backend/public/uploads/drivers

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3001

# Exponer puerto del backend
EXPOSE 3001

# Iniciar servidor
CMD ["node", "backend/dist/server.js"]
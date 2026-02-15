# ---------- BUILDER ----------
FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable

# 1️⃣ copiar package.json y lockfile y instalar TODAS las deps (prod + dev)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 2️⃣ copiar backend
COPY backend ./backend

# 3️⃣ generar cliente Prisma
RUN pnpm exec prisma generate

# 4️⃣ compilar backend TS
RUN pnpm exec tsc --build backend/tsconfig.json

# 5️⃣ copiar frontend y otros archivos esenciales
COPY . .

# 6️⃣ construir frontend (Vite)
RUN pnpm run build:client  # genera /dist

# ---------- RUNTIME ----------
FROM node:20-alpine AS runner

WORKDIR /app
RUN corepack enable

# 1️⃣ instalar solo prod
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 2️⃣ generar cliente Prisma en prod
COPY backend/prisma ./backend/prisma
RUN pnpm exec prisma generate

# 3️⃣ copiar backend compilado
COPY --from=builder /app/backend/dist ./backend/dist

# 4️⃣ copiar frontend compilado
COPY --from=builder /app/dist ./dist

# 5️⃣ crear carpetas para uploads
RUN mkdir -p /app/backend/public/uploads/vehicles \
    /app/backend/public/uploads/drivers

# 6️⃣ variables de entorno
ENV NODE_ENV=production
ENV PORT=3001

# 7️⃣ exponer puerto
EXPOSE 3001

# 8️⃣ migraciones + arrancar servidor
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node backend/dist/server.js"]
# ---------- BUILDER ----------
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

# copiar package.json y lockfile
COPY package.json pnpm-lock.yaml ./

# instalar TODAS las dependencias (dev + prod) para poder construir frontend
RUN pnpm install --frozen-lockfile

# copiar backend y frontend
COPY backend ./backend
COPY . .   # copia todo, incluyendo frontend

# generar cliente Prisma
RUN pnpm exec prisma generate

# compilar backend
RUN pnpm exec tsc --build backend/tsconfig.json

# construir frontend
RUN pnpm run build:client  # ahora sí existe y tiene deps

# ---------- RUNTIME ----------
FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# prisma
COPY backend/prisma ./backend/prisma
RUN pnpm exec prisma generate

# copiar backend compilado
COPY --from=builder /app/backend/dist ./backend/dist

# copiar frontend compilado
COPY --from=builder /app/dist ./dist

# carpetas uploads
RUN mkdir -p /app/backend/public/uploads/vehicles /app/backend/public/uploads/drivers

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node backend/dist/server.js"]
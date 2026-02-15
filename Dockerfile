# ---------- BUILDER ----------
FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable

# instalar dependencias
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# copiar todo el backend (TS), no dist
COPY backend ./backend

# generar cliente Prisma
RUN pnpm exec prisma generate

# compilar TypeScript
RUN pnpm exec tsc --build backend/tsconfig.json

COPY . .
RUN pnpm exec build:client  # tu script "build:client" genera /dist

# ---------- RUNTIME ----------
FROM node:20-alpine AS runner

WORKDIR /app
RUN corepack enable

# instalar solo prod
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# generar cliente Prisma de nuevo
COPY backend/prisma ./backend/prisma
RUN pnpm exec prisma generate

# copiar la app compilada
COPY --from=builder /app/backend/dist ./backend/dist

# carpetas de uploads
RUN mkdir -p /app/backend/public/uploads/vehicles \
    /app/backend/public/uploads/drivers

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# migraciones + arrancar server
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node backend/dist/server.js"]
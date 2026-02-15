# ---------- BUILDER ----------
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

# instalar todas las deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# copiar backend completo
COPY backend ./backend
# copiar tsconfigs
COPY tsconfig.json tsconfig.server.json ./

# generar Prisma
RUN pnpm exec prisma generate

# compilar backend
RUN pnpm exec tsc --build tsconfig.server.json

# copiar frontend
COPY . .
RUN pnpm run build:client  # genera /dist

# ---------- RUNTIME ----------
FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable

# instalar solo prod
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# generar cliente Prisma en prod
COPY backend/prisma ./backend/prisma
RUN pnpm exec prisma generate

# copiar backend compilado
COPY --from=builder /app/backend/dist ./backend/dist

# copiar frontend compilado
COPY --from=builder /app ./dist

# crear carpetas de uploads
RUN mkdir -p /app/backend/public/uploads/vehicles \
    /app/backend/public/uploads/drivers

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node backend/dist/server.js"]
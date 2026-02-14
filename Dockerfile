FROM node:20-alpine

WORKDIR /app
RUN corepack enable

# 1️⃣ copiar manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 2️⃣ copiar prisma schema ANTES de instalar
COPY backend/prisma ./backend/prisma

# 3️⃣ instalar deps
RUN pnpm install --frozen-lockfile

# 4️⃣ generar cliente prisma
RUN pnpm exec prisma generate

# 5️⃣ copiar builds
COPY dist ./dist
COPY backend/dist ./backend/dist

# uploads
RUN mkdir -p /app/backend/public/uploads/vehicles \
    /app/backend/public/uploads/drivers

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node backend/dist/server.js"]

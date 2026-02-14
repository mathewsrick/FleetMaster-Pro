# ---------- BUILDER ----------
FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json

RUN pnpm install --frozen-lockfile

# copiar todo el código
COPY . .

# generar prisma client
RUN pnpm prisma generate

# compilar typescript
RUN pnpm build


# ---------- PRODUCTION ----------
FROM node:20-alpine

WORKDIR /app
RUN corepack enable

ENV NODE_ENV=production
ENV PORT=3001

# solo dependencias de producción
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json

RUN pnpm install --prod --frozen-lockfile

# copiar lo compilado
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules ./node_modules

# uploads
RUN mkdir -p /app/backend/public/uploads/vehicles \
    /app/backend/public/uploads/drivers

EXPOSE 3001

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node backend/dist/server.js"]

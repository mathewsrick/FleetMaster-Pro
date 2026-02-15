# ---------- BUILDER ----------
FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/prisma ./backend/prisma

RUN pnpm install --frozen-lockfile

# generar cliente
RUN pnpm exec prisma generate

COPY dist ./dist
COPY backend/dist ./backend/dist


# ---------- RUNTIME ----------
FROM node:20-alpine AS runner

WORKDIR /app
RUN corepack enable

# solo dependencias producción
COPY package.json pnpm-lock.yaml ./
COPY backend/prisma ./backend/prisma

RUN pnpm install --prod --frozen-lockfile

# generar cliente otra vez (MUY IMPORTANTE)
RUN pnpm exec prisma generate

# copiar app compilada
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend/dist ./backend/dist

RUN mkdir -p /app/backend/public/uploads/vehicles \
    /app/backend/public/uploads/drivers

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node backend/dist/server.js"]
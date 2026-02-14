# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

# copiar todo el proyecto
COPY . .

# generar prisma
RUN pnpm prisma generate

# ---------- PRODUCTION ----------
FROM node:20-alpine

WORKDIR /app
RUN corepack enable

# solo deps producción
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

# copiar build compilado
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "pnpm prisma migrate deploy && node backend/dist/server.js"]
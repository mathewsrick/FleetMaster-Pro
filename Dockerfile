FROM node:20-alpine

WORKDIR /app

RUN corepack enable

# Copiar dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copiar código compilado
COPY dist ./dist
COPY backend/dist ./backend/dist
COPY backend/prisma ./backend/prisma

# Crear carpetas uploads
RUN mkdir -p /app/backend/public/uploads/vehicles \
    /app/backend/public/uploads/drivers

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD pnpm prisma:migrate && node backend/dist/server.js
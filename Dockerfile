FROM node:20-alpine

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/prisma ./backend/prisma

RUN pnpm install --frozen-lockfile

# 👇 importante
RUN node node_modules/prisma/build/index.js generate

COPY dist ./dist
COPY backend/dist ./backend/dist

RUN mkdir -p /app/backend/public/uploads/vehicles \
    /app/backend/public/uploads/drivers

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node backend/dist/server.js"]

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
COPY services/api/package.json ./services/api/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install --frozen-lockfile --filter @canvasos/api...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @canvasos/api build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S canvasos -u 1001
WORKDIR /app/services/api
COPY --from=builder --chown=canvasos:nodejs /app/services/api/dist ./dist
COPY --from=builder --chown=canvasos:nodejs /app/services/api/node_modules ./node_modules
COPY --from=builder --chown=canvasos:nodejs /app/services/api/package.json .
USER canvasos
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/server.js"]

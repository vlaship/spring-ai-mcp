FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci

COPY src ./src

RUN npm run build:all

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

RUN chown -R appuser:nodejs /app

USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
FROM node:24-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/package.json .
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile
EXPOSE 8080
CMD ["node", "dist/index.cjs"]

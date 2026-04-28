# Use Node 24 Alpine for a small production container
FROM node:24-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY . .

# Delete the macOS-generated lockfile so pnpm resolves platform-specific
# optional deps (e.g. @rollup/rollup-linux-x64-musl) for Alpine Linux.
RUN rm -f pnpm-lock.yaml && pnpm install

ARG VITE_PORT=5173
ARG BASE_PATH=/
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLERK_PROXY_URL
ARG NODE_ENV=production

ENV PORT=${VITE_PORT}
ENV BASE_PATH=${BASE_PATH}
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}
ENV VITE_CLERK_PROXY_URL=${VITE_CLERK_PROXY_URL}
ENV NODE_ENV=${NODE_ENV}

RUN pnpm --filter @workspace/ai-hub run build
RUN pnpm --filter @workspace/api-server run build

ENV PORT=8080

EXPOSE 8080
CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]

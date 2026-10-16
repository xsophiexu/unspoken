# syntax=docker/dockerfile:1
# The Unspoken API for Cloud Run or any container host. Build from the repository root, since the
# bundle includes the workspace packages:
#   docker build -f services/api/Dockerfile -t unspoken-api .
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS base
# pnpm at the version in the root package.json's packageManager field.
RUN corepack enable
WORKDIR /repo
# The workspace hoists dependencies for React Native; the isolated layout installs only what the
# filtered packages need.
ENV npm_config_node_linker=isolated

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter @unspoken/api...
RUN pnpm --filter @unspoken/api build

# What the bundle leaves out (firebase-admin), at the lockfile's versions.
FROM base AS runtime-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/api/package.json services/api/
RUN pnpm install --prod --frozen-lockfile --filter @unspoken/api

FROM node:${NODE_VERSION}-slim
ENV NODE_ENV=production
# Cloud Run's front end appends the caller's address to X-Forwarded-For. Use 0 when nothing sits in
# front of the container, or 2 behind an external Application Load Balancer.
ENV TRUST_PROXY_HOPS=1
WORKDIR /app/services/api
COPY --from=runtime-deps /repo/node_modules /app/node_modules
COPY --from=runtime-deps /repo/services/api/node_modules ./node_modules
COPY --from=build /repo/services/api/dist ./dist
USER node
# Cloud Run sets PORT (8080 unless configured otherwise).
EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/main.js"]

# Two stages: build the static site with Node + pnpm, then serve only the
# built files with Caddy. The final image has no Node, no source, no secrets.

# --- Build ---------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
# pnpm's version comes from "packageManager" in package.json.
RUN corepack enable

# Install dependencies first, so Docker can cache this layer between code changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/parser/package.json packages/parser/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

COPY . .
# Run the parser tests on every deploy: a broken parser never goes live.
RUN pnpm --filter @kind-book-notes/parser test
RUN pnpm --filter @kind-book-notes/web build

# --- Serve ---------------------------------------------------------------
FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/web/dist /srv
# Plain HTTP inside the container: Coolify's proxy and Cloudflare handle HTTPS.
EXPOSE 80
# Lets Coolify know when the container is ready to receive traffic.
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1/ || exit 1

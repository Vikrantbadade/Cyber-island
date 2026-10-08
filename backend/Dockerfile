FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# The pnpm version is pinned by "packageManager" in package.json (corepack reads it). Keep it equal to the pnpm that
# produced pnpm-lock.yaml; an unpinned corepack installs the newest pnpm and the build can break (ERR_PNPM_IGNORED_BUILDS).
RUN corepack enable
WORKDIR /app

FROM base AS deps
# pnpm-workspace.yaml holds the allowBuilds list (prisma, @prisma/client, esbuild); without it pnpm 10+ aborts with ERR_PNPM_IGNORED_BUILDS
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --frozen-lockfile: install exactly what pnpm-lock.yaml says and fail if it is out of sync with package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN pnpm prisma generate && pnpm tsc -p tsconfig.json

# Runtime keeps full node_modules: the entrypoint needs the prisma CLI (db push). Seeding is NOT part of container start:
# initialize game data and import teams from the admin page (/admin -> Setup).
FROM base AS runtime
ENV NODE_ENV=production
# Everything below runs as the unprivileged "node" user (uid 1000) that ships with the node image.
RUN chown node:node /app
USER node
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/prisma ./prisma
# Admin web page: static files served by Express at /admin (src/app.ts resolves ../admin from dist/)
COPY --chown=node:node admin ./admin
COPY --chown=node:node package.json pnpm-workspace.yaml ./
EXPOSE 3000
# db push only syncs the table structure (no data). It fails instead of dropping data, so a bad schema change stops the boot.
# The prisma binary is called directly (not through pnpm) so starting the container never needs corepack or the network.
CMD ["sh", "-c", "node_modules/.bin/prisma db push --skip-generate && node dist/server.js"]

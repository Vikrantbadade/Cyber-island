FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS deps
# pnpm-workspace.yaml holds the allowBuilds list (prisma, @prisma/client, esbuild); without it pnpm 10+ aborts with ERR_PNPM_IGNORED_BUILDS
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
RUN pnpm install

FROM deps AS build
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN pnpm prisma generate && pnpm tsc -p tsconfig.json

# Runtime keeps full node_modules: the entrypoint needs prisma CLI (db push) and tsx (seed).
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json pnpm-workspace.yaml ./
EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma db push --skip-generate && pnpm seed && node dist/server.js"]

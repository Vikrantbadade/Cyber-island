# Builds the game (Vite) and serves it with nginx.
# The nginx configuration is NOT baked in: docker-compose.yml mounts ../nginx/default.conf (static files + /api proxy
# + admin access rules), so rate limits and admin access can be changed without rebuilding the image.
# Run on its own, this image only serves the static game (no /api proxy).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

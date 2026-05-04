# ─────────────────────────────────────────────────────────────
# Frontend Dockerfile — ElevateCV (React + Vite → Nginx)
# Multi-stage: build with Node 20, serve with Nginx Alpine
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-slim AS build

WORKDIR /app

# Copy package files first for layer cache
COPY package*.json ./

# Install all deps (including devDeps needed for build)
RUN npm ci

# Copy source
COPY . .

# Build production bundle
RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────
FROM nginx:alpine

# Custom nginx config (SPA routing + /api proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

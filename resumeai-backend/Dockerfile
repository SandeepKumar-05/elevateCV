# ─────────────────────────────────────────────────────────────
# Backend Dockerfile — ResumeAI v3
# Node 20 LTS + Puppeteer dependencies
# ─────────────────────────────────────────────────────────────
FROM node:20-slim

# Install Puppeteer system dependencies + curl (for healthcheck)
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    ca-certificates \
    procps \
    libnss3 \
    libxss1 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    fonts-liberation \
    libpangocairo-1.0-0 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (layer cache optimisation)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Expose API port
EXPOSE 3002

# Healthcheck (curl is now installed above)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3002/api/health || exit 1

# Start server
CMD ["node", "server.js"]

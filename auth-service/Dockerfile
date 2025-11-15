FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies with clean install
RUN npm ci --prefer-offline --no-audit --progress=false \
    && npm cache clean --force

# Verify critical auth dependencies
RUN node -e "require('jsonwebtoken')" || (echo "❌ JWT not installed!" && exit 1)

# Copy source code
COPY . .

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8082/api/health || exit 1

CMD ["npm", "run", "start"]
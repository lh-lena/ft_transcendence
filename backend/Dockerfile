FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy dependency files first
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --prefer-offline --no-audit --progress=false \
    && npm cache clean --force

# Verify Prisma and Fastify are installed
RUN node -e "require('@prisma/client')" || (echo "❌ Prisma client not installed!" && exit 1)
RUN node -e "require('fastify')" || (echo "❌ Fastify not installed!" && exit 1)

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /app/data && chmod 755 /app/data

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["/bin/sh", "-c", "npx prisma migrate deploy && npm run run"]
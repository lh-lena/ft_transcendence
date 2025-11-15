FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy source and config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Verify build output
RUN test -f dist/server.js || (echo "❌ Build failed - dist/server.js not found!" && exit 1)

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies and curl for healthcheck
RUN apk add --no-cache curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --prefer-offline --no-audit --progress=false \
    && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# Run as root (required for 42 compatibility with bind mounts)
CMD ["node", "dist/server.js"]
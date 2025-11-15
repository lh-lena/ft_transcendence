FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files (wildcards are safer here)
COPY package*.json ./

# Install dependencies - works with or without lock file
RUN if [ -f package-lock.json ]; then \
        echo "📦 Using package-lock.json"; \
        npm ci --prefer-offline --no-audit --progress=false; \
    else \
        echo "📦 No lock file found, using npm install"; \
        npm install --prefer-offline --no-audit --progress=false; \
    fi

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

# Copy package files
COPY package*.json ./

# Install production dependencies - works with or without lock file
RUN if [ -f package-lock.json ]; then \
        echo "📦 Using package-lock.json for production"; \
        npm ci --omit=dev --prefer-offline --no-audit --progress=false; \
    else \
        echo "📦 No lock file found, using npm install for production"; \
        npm install --omit=dev --prefer-offline --no-audit --progress=false; \
    fi && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

CMD ["node", "dist/server.js"]
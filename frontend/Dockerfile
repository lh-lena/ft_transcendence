FROM node:20-alpine AS base

# Install system dependencies for potential native modules
RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies with clean install
RUN npm ci --prefer-offline --no-audit --progress=false \
    && npm cache clean --force

# Verify critical dependencies are installed
RUN node -e "require('vite')" || (echo "❌ Vite not installed!" && exit 1)

# Accept build arguments
ARG VITE_WEBSOCKET_URL
ARG VITE_AUTH_URL

# Set them as environment variables so Vite can use them during build
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL
ENV VITE_AUTH_URL=$VITE_AUTH_URL

# Copy source files
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
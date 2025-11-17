# Multi-stage Docker build optimized for speed
# - Uses BuildKit cache mounts for npm and Vite
# - Copies files in layers for better caching
# - Excludes unnecessary files via .dockerignore

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and configs first for better caching
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./  # If exists
COPY postcss.config.js ./

# Install dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production && \
    npm cache clean --force

# Copy source code in smaller chunks for better layer caching
COPY src ./src/
COPY index.html ./

# Build with cache mount
RUN --mount=type=cache,target=/app/node_modules/.vite \
    npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

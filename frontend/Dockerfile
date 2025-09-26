# Multi-stage build for React frontend
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Set environment variables for build
ENV NODE_ENV=development
ENV GENERATE_SOURCEMAP=false

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application (skip tsc since vite handles TypeScript)
RUN npx vite build

# Production stage with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactuser -u 1001 -G nodejs && \
    chown -R reactuser:nodejs /usr/share/nginx/html && \
    chown -R reactuser:nodejs /var/cache/nginx && \
    chown -R reactuser:nodejs /var/log/nginx && \
    chown -R reactuser:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R reactuser:nodejs /var/run/nginx.pid

# Switch to non-root user
USER reactuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
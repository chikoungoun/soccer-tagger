# Soccer Manager Frontend - Docker Setup

This document provides instructions for running the Soccer Manager frontend using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Soccer Manager Backend running (or configured to connect to existing backend)

## Quick Start

### 1. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Update `VITE_API_BASE_URL` to point to your backend
- Configure other settings as needed

### 2. Build and Run

Using Docker Compose (recommended):

```bash
# Build and start both frontend and backend
docker-compose up -d

# View logs
docker-compose logs -f soccer-frontend

# Stop containers
docker-compose down
```

Using Docker directly:

```bash
# Build the image
docker build -t soccer-manager-frontend .

# Run the container
docker run -d \
  --name soccer-manager-frontend \
  -p 3000:3000 \
  -e VITE_API_BASE_URL=http://localhost:8000 \
  soccer-manager-frontend
```

### 3. Verify Installation

Open your browser and navigate to:
```
http://localhost:3000
```

Check the health endpoint:
```bash
curl http://localhost:3000/
```

## Architecture

### Multi-Stage Build

The Dockerfile uses a multi-stage build process:

1. **Build Stage**: Uses Node.js 18 Alpine to build the React application
2. **Production Stage**: Uses Nginx Alpine to serve the static files

### Frontend Stack

- **React 18** with TypeScript
- **Vite** for fast build and development
- **Tailwind CSS** for styling
- **Nginx** for production serving

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `NODE_ENV` | Environment mode | `production` |
| `GENERATE_SOURCEMAP` | Generate source maps | `false` |

### Nginx Configuration

The included `nginx.conf` provides:

- **SPA Routing**: All routes serve `index.html` for client-side routing
- **API Proxy**: `/api/*` routes are proxied to the backend
- **Security Headers**: CORS, CSP, and other security headers
- **Gzip Compression**: Optimized asset delivery
- **Caching**: Static assets cached for 1 year

### Ports

- `3000` - Frontend application (Nginx)

## Development vs Production

### Development Mode

For development with hot reload:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Mode

The Docker container runs the optimized production build:

- TypeScript compiled to JavaScript
- Assets minified and optimized
- Source maps disabled (configurable)
- Served via Nginx for optimal performance

## Full Stack Deployment

### Option 1: Separate Containers

Run frontend and backend in separate containers:

```bash
# Backend (from backend directory)
cd ../backend
docker-compose up -d

# Frontend (from frontend directory)
cd ../frontend
docker-compose up -d
```

### Option 2: Combined Stack

Create a root-level `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/soccer_manager.db:/app/soccer_manager.db
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
```

## Production Deployment

### Docker Build Optimization

The Dockerfile is optimized for production:

- Multi-stage build reduces final image size
- Node modules cached in separate layer
- Static assets served via Nginx
- Non-root user for security

### Performance Optimizations

- **Gzip Compression**: Enabled for all text assets
- **Static Caching**: Long-term caching for immutable assets
- **Minification**: JavaScript and CSS minified
- **Tree Shaking**: Unused code eliminated

### Security Features

- **Security Headers**: CSP, HSTS, X-Frame-Options
- **Non-root User**: Container runs as unprivileged user
- **Hidden Server Info**: Nginx version hidden
- **API Proxy**: Secure proxy to backend API

## Troubleshooting

### Common Issues

1. **API calls failing**:
   ```bash
   # Check backend connectivity
   docker exec soccer-manager-frontend wget -qO- http://host.docker.internal:8000/health
   ```

2. **Build failures**:
   ```bash
   # Check build logs
   docker build -t soccer-frontend . --progress=plain --no-cache
   ```

3. **Nginx errors**:
   ```bash
   # Check Nginx logs
   docker logs soccer-manager-frontend
   ```

### Health Checks

Monitor container health:

```bash
# Check health status
docker ps

# View health check logs
docker inspect soccer-manager-frontend | grep -A 10 "Health"
```

### Performance Monitoring

Monitor resource usage:

```bash
# Container stats
docker stats soccer-manager-frontend

# Nginx access logs
docker exec soccer-manager-frontend tail -f /var/log/nginx/access.log
```

## Build Configuration

### Build Arguments

Customize the build process:

```bash
docker build \
  --build-arg NODE_ENV=production \
  --build-arg GENERATE_SOURCEMAP=false \
  -t soccer-frontend .
```

### Multi-Platform Builds

Build for multiple architectures:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t soccer-frontend .
```

## Integration with Backend

The frontend automatically proxies API calls to the backend:

- Development: Vite dev server proxy
- Production: Nginx reverse proxy
- API calls to `/api/*` are forwarded to backend
- CORS handled by proxy configuration

## Monitoring and Logging

### Access Logs

Nginx access logs are available:

```bash
docker exec soccer-manager-frontend tail -f /var/log/nginx/access.log
```

### Error Logs

Application errors logged to:

```bash
docker exec soccer-manager-frontend tail -f /var/log/nginx/error.log
```

### Health Monitoring

Built-in health checks monitor:
- Container responsiveness
- Nginx service status
- Application availability
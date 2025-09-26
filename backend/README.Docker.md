# Soccer Manager Backend - Docker Setup

This document provides instructions for running the Soccer Manager backend using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### 1. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your production values:
- Change `SECRET_KEY` to a strong random string
- Update `CORS_ORIGINS` for your frontend domain
- Configure other settings as needed

### 2. Build and Run

Using Docker Compose (recommended):

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

Using Docker directly:

```bash
# Build the image
docker build -t soccer-manager-backend .

# Run the container
docker run -d \
  --name soccer-manager-backend \
  -p 8000:8000 \
  -v $(pwd)/soccer_manager.db:/app/soccer_manager.db \
  -v $(pwd)/uploads:/app/uploads \
  --env-file .env \
  soccer-manager-backend
```

### 3. Verify Installation

Check the health endpoint:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy"}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT secret key | Required |
| `DATABASE_URL` | SQLite database path | `sqlite:///./soccer_manager.db` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiration time | `30` |
| `CORS_ORIGINS` | Allowed CORS origins | `["*"]` |

### Volumes

- `/app/soccer_manager.db` - SQLite database file
- `/app/uploads` - File uploads (team logos, player photos)

### Ports

- `8000` - FastAPI application server

## Development

For development with hot reload:

```bash
# Install dependencies locally
pip install -r requirements.txt

# Run with hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Database Management

### Initial Setup

If running for the first time, you may need to initialize the database:

```bash
# Connect to running container
docker exec -it soccer-manager-backend bash

# Run database migrations (if using Alembic)
alembic upgrade head

# Create initial admin user
python create_admin.py
```

### Backup

```bash
# Backup database
docker cp soccer-manager-backend:/app/soccer_manager.db ./backup_$(date +%Y%m%d_%H%M%S).db
```

## Monitoring

### Health Checks

The container includes built-in health checks:

```bash
# Check container health
docker ps

# View health check logs
docker inspect soccer-manager-backend | grep -A 10 "Health"
```

### Logs

```bash
# View real-time logs
docker-compose logs -f soccer-manager-backend

# View specific number of log lines
docker-compose logs --tail=100 soccer-manager-backend
```

## Production Deployment

### Security Considerations

1. **Change default SECRET_KEY**: Generate a strong random key
2. **Restrict CORS origins**: Specify exact frontend domains
3. **Use HTTPS**: Deploy behind a reverse proxy with SSL
4. **File permissions**: Ensure proper permissions on volume mounts
5. **Regular backups**: Implement automated database backups

### Reverse Proxy Example (Nginx)

```nginx
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Common Issues

1. **Permission denied on uploads**:
   ```bash
   chmod 755 uploads/
   ```

2. **Database locked**:
   - Ensure only one instance is running
   - Check file permissions

3. **Health check failing**:
   - Verify container has network access
   - Check application logs for errors

### Debug Mode

Run container with debug output:

```bash
docker-compose up --no-deps soccer-backend
```

## API Documentation

Once running, access the interactive API documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
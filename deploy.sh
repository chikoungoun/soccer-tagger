#!/bin/bash

# Soccer Manager Deployment Script for AWS EC2

echo "🚀 Deploying Soccer Manager to AWS EC2..."

# Stop existing containers
echo "Stopping existing containers..."
docker stop frontend backend 2>/dev/null || true
docker rm frontend backend 2>/dev/null || true

# Build images
echo "Building Docker images..."
docker build -t soccer-backend ./backend
docker build -t soccer-manager-frontend ./frontend

# Create uploads directory
mkdir -p ./backend/uploads

# Start backend container
echo "Starting backend container..."
docker run -d \
  --name backend \
  --restart unless-stopped \
  -p 8000:8000 \
  -v $(pwd)/backend/uploads:/app/uploads \
  soccer-backend

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 10

# Start frontend container
echo "Starting frontend container..."
docker run -d \
  --name frontend \
  --restart unless-stopped \
  -p 3000:3000 \
  soccer-manager-frontend:latest

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://$(curl -s ifconfig.me):3000"
echo "🔗 Backend API: http://$(curl -s ifconfig.me):8000"
echo "📊 Health check: http://$(curl -s ifconfig.me):8000/health"
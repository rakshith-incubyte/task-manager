#!/bin/bash

set -e

echo "=========================================="
echo "Starting Docker Deployment"
echo "=========================================="

# Load environment variables
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
    echo "✓ Loaded environment variables from .env.prod"
else
    echo "✗ Error: .env.prod file not found"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "✗ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✓ Docker installed successfully"
    echo "⚠️  You may need to log out and back in for Docker group to take effect"
else
    echo "✓ Docker is already installed"
fi

# Check if user has Docker permissions
if ! docker ps &> /dev/null; then
    echo "⚠️  Current user doesn't have Docker permissions"
    echo "Adding user to docker group..."
    sudo usermod -aG docker $USER
    echo "✓ User added to docker group"
    echo ""
    echo "Using sudo for Docker commands in this session..."
    # Use sudo for Docker commands if needed
    DOCKER_CMD="sudo docker"
    DOCKER_COMPOSE_CMD="sudo docker compose"
else
    DOCKER_CMD="docker"
    DOCKER_COMPOSE_CMD="docker compose"
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "✗ Docker Compose plugin not available"
    exit 1
else
    echo "✓ Docker Compose is available"
fi

# Login to GitHub Container Registry
echo "Logging in to GitHub Container Registry..."
echo "$GITHUB_TOKEN" | $DOCKER_CMD login ghcr.io -u $GITHUB_ACTOR --password-stdin 2>/dev/null || true
echo "✓ Logged in to GHCR (or using public images)"

# Install envsubst if not available
if ! command -v envsubst &> /dev/null; then
    echo "Installing gettext-base for envsubst..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq gettext-base
    echo "✓ envsubst installed"
fi

# Generate Caddyfile from template
echo "Generating Caddyfile..."
if [ -f .github/Caddyfile.template ]; then
    envsubst < .github/Caddyfile.template > Caddyfile
    echo "✓ Caddyfile generated"
else
    echo "Warning: Caddyfile.template not found, creating default Caddyfile"
    cat > Caddyfile << EOF
{
    email ${EMAIL}
    admin off
}

${DOMAIN} {
    # Backend API - All /api/* endpoints (handle first)
    handle /api/* {
        reverse_proxy backend:8000
    }
    
    # Backend root endpoints (health, docs, redoc, openapi.json)
    handle /health {
        reverse_proxy backend:8000
    }
    
    handle /docs* {
        reverse_proxy backend:8000
    }
    
    handle /redoc* {
        reverse_proxy backend:8000
    }
    
    handle /openapi.json {
        reverse_proxy backend:8000
    }
    
    # Next.js static assets
    handle /_next/* {
        reverse_proxy frontend:3000
    }
    
    # Frontend - All other routes go to Next.js (catch-all)
    handle {
        reverse_proxy frontend:3000
    }
    
    # Enable compression
    encode gzip zstd
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
        -Server
    }
    
    # Logs
    log {
        output file /data/access.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
        format console
    }
}
EOF
    echo "✓ Default Caddyfile created"
fi

# Pull latest images
echo "Pulling latest images from GHCR..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml pull
echo "✓ Images pulled successfully"

# Stop and remove old containers
echo "Stopping existing containers..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml down --remove-orphans
echo "✓ Old containers stopped and removed"

# Start new containers
echo "Starting new containers..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d
echo "✓ Containers started successfully"

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 15

# Run database migrations
echo "Running database migrations..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml exec -T backend /app/.venv/bin/alembic upgrade head
echo "✓ Database migrations completed"

# Prune old images to save space
echo "Cleaning up old Docker images..."
$DOCKER_CMD image prune -af --filter "until=72h" || true
echo "✓ Old images pruned"

# Show running containers
echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Domain: https://${DOMAIN}"
echo "=========================================="

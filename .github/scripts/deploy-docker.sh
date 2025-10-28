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
else
    echo "✓ Docker is already installed"
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
echo "$GITHUB_TOKEN" | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin 2>/dev/null || true
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
    # Frontend
    handle / {
        reverse_proxy frontend:3000
    }
    
    # Backend API
    handle /api/* {
        reverse_proxy backend:8000
    }
    
    # Backend root endpoints (health, docs, etc.)
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
    
    # Logs
    log {
        output file /data/access.log
        format console
    }
}
EOF
    echo "✓ Default Caddyfile created"
fi

# Pull latest images
echo "Pulling latest images from GHCR..."
docker compose -f docker-compose.prod.yml pull
echo "✓ Images pulled successfully"

# Stop and remove old containers
echo "Stopping existing containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans
echo "✓ Old containers stopped and removed"

# Start new containers
echo "Starting new containers..."
docker compose -f docker-compose.prod.yml up -d
echo "✓ Containers started successfully"

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 15

# Run database migrations
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend /app/.venv/bin/alembic upgrade head
echo "✓ Database migrations completed"

# Prune old images to save space
echo "Cleaning up old Docker images..."
docker image prune -af --filter "until=72h" || true
echo "✓ Old images pruned"

# Show running containers
echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Domain: https://${DOMAIN}"
echo "=========================================="

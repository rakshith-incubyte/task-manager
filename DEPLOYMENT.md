# Docker Deployment Guide

This document explains the Docker-based deployment workflow for the Task Manager application.

## Overview

The application uses a modern Docker-based CI/CD pipeline that:
1. Builds Docker images for backend and frontend
2. Pushes images to GitHub Container Registry (GHCR)
3. Deploys to EC2 using Docker Compose

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions                          │
│  ┌──────────────┐      ┌──────────────┐               │
│  │ Build Images │ ───> │ Push to GHCR │               │
│  └──────────────┘      └──────────────┘               │
│                              │                          │
│                              ▼                          │
│                      ┌──────────────┐                  │
│                      │   Deploy     │                  │
│                      └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │      EC2 Instance      │
                  │  ┌──────────────────┐  │
                  │  │ Docker Compose   │  │
                  │  │  - Backend       │  │
                  │  │  - Frontend      │  │
                  │  │  - Database      │  │
                  │  │  - Caddy Proxy   │  │
                  │  └──────────────────┘  │
                  └────────────────────────┘
```

## Prerequisites

### Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

| Secret | Description | Example |
|--------|-------------|---------|
| `EC2_SSH_KEY` | EC2 SSH private key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `EC2_HOST` | EC2 instance IP or hostname | `203.0.113.1` or `ec2-xxx.compute.amazonaws.com` |
| `EC2_USER` | SSH user for EC2 | `ubuntu` or `ec2-user` |
| `SECRET_KEY` | FastAPI secret key | `your-secret-key-here` |
| `DB_USER` | PostgreSQL username | `taskmanager_user` |
| `DB_PASSWORD` | PostgreSQL password | `secure-password-here` |
| `DB_NAME` | PostgreSQL database name | `taskmanager` |
| `DOMAIN` | Your domain name | `taskmanager.example.com` |
| `EMAIL` | Email for Let's Encrypt | `admin@example.com` |

### EC2 Instance Requirements

1. **Operating System**: Ubuntu 22.04 LTS or newer
2. **Docker**: Will be auto-installed by deployment script
3. **Disk Space**: Minimum 20GB free space
4. **Memory**: Minimum 2GB RAM (4GB recommended)
5. **Security Groups**: 
   - Port 22 (SSH) - For deployment
   - Port 80 (HTTP) - For Caddy
   - Port 443 (HTTPS) - For Caddy
   - Port 443 UDP (HTTP/3) - For Caddy

## Deployment Files

### 1. docker-compose.prod.yml

Production Docker Compose configuration that:
- Pulls images from GHCR
- Configures all services (backend, frontend, db, caddy)
- Sets up networks and volumes
- Includes health checks and logging

### 2. .github/scripts/deploy-docker.sh

Deployment script that:
- Installs Docker if not present
- Logs into GHCR
- Generates Caddyfile from template
- Pulls latest images
- Stops old containers
- Starts new containers
- Runs database migrations
- Cleans up old images

### 3. .github/workflows/deploy.yml

GitHub Actions workflow with two jobs:

#### Job 1: Build and Push
- Builds backend and frontend Docker images
- Tags images with branch name, SHA, and `latest`
- Pushes to GHCR with caching

#### Job 2: Deploy
- SSH into EC2 instance
- Copies deployment files
- Creates `.env.prod` with secrets
- Executes deployment script
- Verifies deployment health

## Usage

### Automatic Deployment

The workflow automatically triggers on:
- Push to `main` branch
- Manual workflow dispatch

```bash
# After merging to main:
git checkout main
git pull
# Push will trigger deployment automatically
```

### Manual Deployment

1. Go to Actions → Build, Push to GHCR & Deploy to EC2
2. Click "Run workflow"
3. Select branch (usually `main`)
4. Click "Run workflow"

## CI/CD Pipeline

### CI Workflow (ci.yml)

Runs on every push and pull request:

1. **Backend Tests**: Pytest with coverage reporting
2. **Frontend Tests**: Vitest with coverage reporting
3. **Code Quality**: Linting and type checking
4. **Docker Build Test**: Validates Docker images build correctly

### Deploy Workflow (deploy.yml)

Runs on push to main or manual trigger:

1. **Build and Push**: 
   - Build Docker images
   - Push to GHCR
   - Cache layers for faster builds

2. **Deploy**:
   - Copy deployment files to EC2
   - Pull images from GHCR
   - Deploy with Docker Compose
   - Run migrations
   - Health checks

## Container Images

Images are stored in GitHub Container Registry:

```
ghcr.io/YOUR_USERNAME/task-manager/backend:latest
ghcr.io/YOUR_USERNAME/task-manager/frontend:latest
```

### Image Tags

- `latest` - Latest build from main branch
- `main` - Main branch
- `main-SHA` - Specific commit SHA
- Version tags (if using semantic versioning)

## Local Testing

Test the Docker setup locally before deploying:

```bash
# Build and run locally
docker compose up --build

# Test production configuration locally
docker compose -f docker-compose.prod.yml up

# Stop containers
docker compose down
```

## Monitoring

### Check Container Status

```bash
ssh user@your-ec2-instance
cd /var/www/myapp
docker compose -f docker-compose.prod.yml ps
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f caddy
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health  
curl http://localhost:3000/api/health

# External access
curl https://your-domain.com/health
```

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs**
   - Go to Actions tab
   - Click on failed workflow
   - Review error messages

2. **SSH into EC2 and check**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   docker compose -f docker-compose.prod.yml logs
   ```

### Container Not Starting

```bash
# Check container status
docker ps -a

# Check specific container logs
docker logs taskmanager-backend
docker logs taskmanager-frontend
docker logs taskmanager-db
docker logs taskmanager-caddy
```

### Database Issues

```bash
# Check database connectivity
docker compose -f docker-compose.prod.yml exec backend python -c "from app.database import engine; print(engine.url)"

# Run migrations manually
docker compose -f docker-compose.prod.yml exec backend /app/.venv/bin/alembic upgrade head
```

### Image Pull Failures

1. **Check GHCR authentication**
   - Ensure images are public or EC2 has access
   - For private images, set up GHCR authentication on EC2

2. **Make images public** (if desired)
   - Go to GitHub → Packages
   - Select package
   - Package settings → Change visibility

### Caddy SSL Issues

```bash
# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy

# Verify DNS is pointing to EC2
dig your-domain.com

# Check if port 443 is accessible
sudo netstat -tlnp | grep :443
```

## Rollback

### Quick Rollback

Deploy a specific image tag:

```bash
ssh user@your-ec2-instance
cd /var/www/myapp

# Edit .env.prod to use specific tag
sed -i 's/IMAGE_TAG=latest/IMAGE_TAG=main-abc123/' .env.prod

# Redeploy
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Full Rollback via GitHub

1. Revert the problematic commit
2. Push to main
3. Deployment will automatically trigger

## Maintenance

### Update Images

```bash
# On EC2
cd /var/www/myapp
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Backup Database

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql

# Restore backup
docker compose -f docker-compose.prod.yml exec -T db psql -U $POSTGRES_USER $POSTGRES_DB < backup.sql
```

### Clean Up

```bash
# Remove old images
docker image prune -af --filter "until=72h"

# Remove unused volumes
docker volume prune -f

# Remove unused networks
docker network prune -f
```

## Security Best Practices

1. **Keep secrets secure**: Never commit secrets to repository
2. **Use SSH keys**: Don't use password authentication
3. **Keep Docker updated**: Regularly update Docker and images
4. **Monitor logs**: Set up log aggregation and monitoring
5. **Regular backups**: Automate database backups
6. **SSL/TLS**: Caddy automatically handles Let's Encrypt certificates
7. **Network isolation**: Use Docker networks for container communication

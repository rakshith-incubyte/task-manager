# Task Manager

A modern task management application with FastAPI backend and Next.js frontend, deployed using Docker and GitHub Container Registry (GHCR).

## Project Structure
```
task-manager/
├── apps/
│   ├── backend/     # Python backend application
│   └── frontend/    # Frontend application (placeholder)
└── .gitignore
```

## Backend Setup

### Technology Stack
- **Language**: Python 3.14+
- **Build Tool**: Poetry
- **Package Manager**: Poetry Core 2.0.0+
- **Backend Framework**: FastAPI

### Project Configuration
- **Package Name**: backend
- **Version**: 0.1.0
- **Author**: Rakshith Vikramraj

### Directory Structure
```
backend/
├── src/
│   └── app/         # Main application code
├── tests/           # Test files
├── pyproject.toml   # Poetry configuration
└── README.md
```

## 🚀 Quick Start

### Local Development with Docker

```bash
# Clone the repository
git clone <repository-url>
cd task-manager

# Start all services
docker compose up --build

# Access the application
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
# Frontend: http://localhost:3000
```

### Manual Setup (Without Docker)

#### Backend
```bash
cd apps/backend
poetry install
poetry run uvicorn app.main:app --reload
```

#### Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Caddy (Reverse Proxy)         │
│         SSL/TLS, Load Balancing         │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼───────┐
│    Frontend    │  │   Backend    │
│   (Next.js)    │  │  (FastAPI)   │
│   Port 3000    │  │  Port 8000   │
└────────────────┘  └──────┬───────┘
                           │
                    ┌──────▼────────┐
                    │   PostgreSQL  │
                    │   Port 5432   │
                    └───────────────┘
```

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.14
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 17
- **Migrations**: Alembic
- **Package Manager**: Poetry 2.2.1
- **Testing**: Pytest with coverage

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Package Manager**: pnpm
- **Testing**: Vitest

### DevOps
- **Containerization**: Docker & Docker Compose
- **Registry**: GitHub Container Registry (GHCR)
- **CI/CD**: GitHub Actions
- **Reverse Proxy**: Caddy 2
- **SSL**: Let's Encrypt (automatic)

## 📦 Deployment

### Docker-based Deployment to EC2

This project uses automated Docker-based deployment with GitHub Actions.

**Quick Links:**
- 📘 [Migration Summary](./MIGRATION_SUMMARY.md) - Quick overview of the deployment setup
- 📋 [Migration Checklist](./MIGRATION_CHECKLIST.md) - Step-by-step deployment guide
- 📚 [Deployment Guide](./DEPLOYMENT.md) - Comprehensive documentation

**Workflow:**
1. Push to `main` branch
2. GitHub Actions builds Docker images
3. Images pushed to GHCR
4. EC2 pulls images and deploys via Docker Compose

**Deployment Files:**
- `docker-compose.yml` - Local development
- `docker-compose.prod.yml` - Production deployment
- `.github/workflows/deploy.yml` - Deployment pipeline
- `.github/workflows/ci.yml` - CI pipeline with tests

### Manual Deployment

```bash
# On EC2 instance
cd /var/www/myapp

# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Deploy
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
```

## 🧪 Testing

### Backend Tests
```bash
cd apps/backend
poetry run pytest --cov=app
```

### Frontend Tests
```bash
cd apps/frontend
npm run test
npm run test:coverage
```

### Docker Build Tests
```bash
# Validate Docker images build correctly
docker compose build
```

## 📊 CI/CD Pipeline

### Continuous Integration (ci.yml)
Runs on every push and PR:
- ✅ Backend tests with coverage
- ✅ Frontend tests with coverage
- ✅ Code quality checks (Ruff, Black, ESLint)
- ✅ Docker build validation
- ✅ Coverage reporting to Coveralls

### Continuous Deployment (deploy.yml)
Runs on push to main or manual trigger:
- 🏗️ Build Docker images
- 📦 Push to GHCR
- 🚀 Deploy to EC2
- ✅ Health checks

## 🔐 Environment Variables

### Backend
```bash
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@host:5432/dbname
DEBUG=false
ALLOWED_ORIGINS=https://your-domain.com
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NODE_ENV=production
```

See `.env.prod.example` for complete configuration.

## 📝 API Documentation

When running locally:
- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🐳 Docker Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| backend | `ghcr.io/{owner}/task-manager/backend` | 8000 | FastAPI application |
| frontend | `ghcr.io/{owner}/task-manager/frontend` | 3000 | Next.js application |
| db | `postgres:17-alpine` | 5432 | PostgreSQL database |
| caddy | `caddy:2-alpine` | 80, 443 | Reverse proxy & SSL |

## 📂 Project Structure

```
task-manager/
├── apps/
│   ├── backend/              # FastAPI backend
│   │   ├── app/             # Application code
│   │   ├── tests/           # Backend tests
│   │   ├── Dockerfile       # Backend Docker image
│   │   └── pyproject.toml   # Python dependencies
│   └── frontend/            # Next.js frontend
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       ├── Dockerfile       # Frontend Docker image
│       └── package.json     # Node dependencies
├── .github/
│   ├── workflows/
│   │   ├── ci.yml          # CI pipeline
│   │   └── deploy.yml      # Deployment pipeline
│   ├── scripts/
│   │   └── deploy-docker.sh # Deployment script
│   └── Caddyfile.template  # Caddy configuration
├── docker-compose.yml       # Local development
├── docker-compose.prod.yml  # Production deployment
├── DEPLOYMENT.md            # Deployment guide
├── MIGRATION_CHECKLIST.md   # Migration steps
└── README.md               # This file
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass: `docker compose build && docker compose up -d`
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

- **Deployment Issues**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Migration Help**: See [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)
- **GitHub Actions**: Check Actions tab for logs
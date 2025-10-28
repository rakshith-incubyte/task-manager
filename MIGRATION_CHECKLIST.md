# Docker Deployment Migration Checklist

This checklist will guide you through migrating from the old direct EC2 deployment to the new Docker-based deployment.

## ✅ Pre-Migration Steps

### 1. Verify GitHub Repository Settings

- [ ] Repository has Actions enabled (Settings → Actions → General)
- [ ] Repository packages are enabled
- [ ] You have admin access to the repository

### 2. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and ensure these secrets exist:

**Required Secrets:**
- [ ] `EC2_SSH_KEY` - Your EC2 SSH private key
- [ ] `EC2_HOST` - EC2 instance IP or hostname
- [ ] `EC2_USER` - SSH username (usually `ubuntu` or `ec2-user`)
- [ ] `SECRET_KEY` - FastAPI secret key (min 32 characters)
- [ ] `DB_USER` - PostgreSQL username
- [ ] `DB_PASSWORD` - PostgreSQL password
- [ ] `DB_NAME` - PostgreSQL database name
- [ ] `DOMAIN` - Your domain name
- [ ] `EMAIL` - Email for Let's Encrypt certificates

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions.

### 3. Update EC2 Security Groups

Ensure these ports are open in your EC2 security group:

- [ ] Port 22 (SSH) - For deployment access
- [ ] Port 80 (HTTP) - For Caddy web server
- [ ] Port 443 (HTTPS) - For Caddy SSL/TLS
- [ ] Port 443 UDP - For HTTP/3 (optional but recommended)

### 4. DNS Configuration

- [ ] Verify your domain's DNS A record points to your EC2 instance IP
- [ ] Wait for DNS propagation (can take up to 48 hours)
- [ ] Test with: `dig your-domain.com` or `nslookup your-domain.com`

## 🚀 Migration Steps

### Step 1: Backup Current Deployment

```bash
# SSH into your EC2 instance
ssh your-user@your-ec2-host

# Backup database (if exists)
pg_dump -U your_db_user your_db_name > /tmp/backup_$(date +%Y%m%d).sql

# Backup any important data
tar -czf /tmp/app_backup_$(date +%Y%m%d).tar.gz /var/www/myapp
```

- [ ] Database backed up
- [ ] Application data backed up

### Step 2: Stop Old Services (Optional)

If you want to stop the old deployment before migrating:

```bash
# Stop old systemd services
sudo systemctl stop taskmanager-backend
sudo systemctl stop taskmanager-frontend
sudo systemctl stop caddy

# Disable old services (optional)
sudo systemctl disable taskmanager-backend
sudo systemctl disable taskmanager-frontend
```

- [ ] Old services stopped (if applicable)

### Step 3: Push Docker Files to Repository

The following files have been created/modified:

**New Files:**
- [ ] `docker-compose.prod.yml` - Production Docker Compose configuration
- [ ] `.github/scripts/deploy-docker.sh` - Deployment script
- [ ] `.env.prod.example` - Environment template
- [ ] `DEPLOYMENT.md` - Deployment documentation
- [ ] `MIGRATION_CHECKLIST.md` - This file

**Modified Files:**
- [ ] `.github/workflows/deploy.yml` - Updated deployment workflow
- [ ] `.github/workflows/ci.yml` - Added Docker build testing
- [ ] `.gitignore` - Added production files

**Commit and push to your repository:**

```bash
git add .
git commit -m "Migrate deployment to Docker with GHCR"
git push origin main
```

- [ ] All files committed
- [ ] Changes pushed to main branch

### Step 4: Make Container Images Public (Recommended)

For easier deployment, make your GHCR images public:

1. Go to GitHub → Your Profile → Packages
2. Select `backend` package
3. Click "Package settings" (right side)
4. Scroll to "Danger Zone"
5. Click "Change visibility" → Select "Public" → Confirm
6. Repeat for `frontend` package

- [ ] Backend image set to public
- [ ] Frontend image set to public

**Alternative:** For private images, you'll need to set up GHCR authentication on EC2 (see DEPLOYMENT.md).

### Step 5: Initial Deployment

Option A: **Automatic Deployment** (Recommended)
```bash
# Push to main triggers automatic deployment
git push origin main
```

Option B: **Manual Deployment**
1. Go to your repository on GitHub
2. Click "Actions" tab
3. Click "Build, Push to GHCR & Deploy to EC2"
4. Click "Run workflow"
5. Select `main` branch
6. Click "Run workflow"

- [ ] Deployment workflow triggered
- [ ] Build and Push job completed successfully
- [ ] Deploy job completed successfully

### Step 6: Verify Deployment

Monitor the GitHub Actions workflow:

- [ ] Backend image built and pushed to GHCR
- [ ] Frontend image built and pushed to GHCR
- [ ] Deployment script executed on EC2
- [ ] Containers started successfully
- [ ] Health checks passed

### Step 7: Test the Application

```bash
# SSH into EC2 to verify
ssh your-user@your-ec2-host
cd /var/www/myapp

# Check container status
docker compose -f docker-compose.prod.yml ps

# All containers should be "Up" and "healthy"
```

**Test endpoints:**
- [ ] Backend health: `curl http://localhost:8000/health`
- [ ] Frontend health: `curl http://localhost:3000/api/health`
- [ ] Domain access: `curl https://your-domain.com/health`
- [ ] Browser access: Open `https://your-domain.com` in browser
- [ ] API docs: `https://your-domain.com/docs`

### Step 8: Restore Data (If needed)

If you have existing data to migrate:

```bash
# SSH into EC2
ssh your-user@your-ec2-host
cd /var/www/myapp

# Restore database backup
docker compose -f docker-compose.prod.yml exec -T db psql -U $POSTGRES_USER $POSTGRES_DB < /tmp/backup_YYYYMMDD.sql
```

- [ ] Database restored (if applicable)
- [ ] Data verified

## 🎉 Post-Migration Steps

### Cleanup Old Deployment

Only do this after verifying the new deployment works:

```bash
# Remove old systemd services
sudo systemctl disable taskmanager-backend
sudo systemctl disable taskmanager-frontend
sudo rm /etc/systemd/system/taskmanager-*.service
sudo systemctl daemon-reload

# Remove old application files (if not needed)
sudo rm -rf /var/www/myapp-old  # Rename first for safety

# Remove old packages (optional)
# Only if you're sure you don't need them
```

- [ ] Old services cleaned up
- [ ] Old files removed (backed up first)

### Setup Monitoring (Recommended)

```bash
# Setup log rotation for Docker
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

- [ ] Docker logging configured
- [ ] Monitoring setup (optional: Prometheus, Grafana, etc.)

### Setup Automated Backups (Recommended)

Create a cron job for daily database backups:

```bash
# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
cd /var/www/myapp
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

- [ ] Backup script created
- [ ] Cron job configured

## 📋 Troubleshooting

### Build Fails

- Check Dockerfiles are present in `apps/backend/` and `apps/frontend/`
- Verify GitHub Actions has correct permissions
- Check build logs in GitHub Actions

### Deployment Fails

- Verify all GitHub Secrets are configured correctly
- Check EC2 SSH access: `ssh your-user@your-ec2-host`
- Review deployment logs in GitHub Actions
- Check EC2 disk space: `df -h`

### Containers Not Starting

```bash
# SSH into EC2
ssh your-user@your-ec2-host
cd /var/www/myapp

# Check container logs
docker compose -f docker-compose.prod.yml logs

# Check specific service
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs db
```

### SSL Certificate Issues

- Verify DNS points to EC2 instance
- Check ports 80 and 443 are open
- Check Caddy logs: `docker compose -f docker-compose.prod.yml logs caddy`
- Wait a few minutes for Let's Encrypt certificate issuance

### Database Connection Issues

- Check database credentials in `.env.prod`
- Verify database container is running: `docker ps`
- Check database logs: `docker compose -f docker-compose.prod.yml logs db`

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Comprehensive deployment guide
- [README.md](./README.md) - Project documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GHCR Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## 🆘 Need Help?

If you encounter issues:

1. Check GitHub Actions logs for the failed step
2. SSH into EC2 and check Docker logs
3. Review DEPLOYMENT.md troubleshooting section
4. Verify all prerequisites are met
5. Check EC2 instance has sufficient resources (disk space, memory)

---

## Summary

**What Changed:**
- ❌ Old: Direct installation, systemd services, manual dependencies
- ✅ New: Docker containers, GHCR image registry, automated deployments

**Benefits:**
- ✅ Consistent environments (dev/staging/prod)
- ✅ Easy rollbacks (tag-based deployments)
- ✅ Automated builds and deployments
- ✅ Better resource isolation
- ✅ Simplified scaling
- ✅ Version-controlled infrastructure

**Next Steps:**
- Monitor the first few deployments
- Set up automated backups
- Configure monitoring and alerting
- Document any custom configurations

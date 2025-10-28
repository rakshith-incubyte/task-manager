# Quick Fix for Docker Permission Error

## Issue
```
permission denied while trying to connect to the Docker daemon socket
```

## Immediate Fix on EC2

SSH into your EC2 instance and run these commands:

```bash
# Add your user to the docker group
style

# Apply the changes immediately (option 1 - restart docker)
sudo systemctl restart docker

# OR apply changes by logging out and back in (option 2)
exit
# Then SSH back in
ssh your-user@your-ec2-host

# Verify Docker works without sudo
docker ps

# If still having issues, use newgrp to apply group changes
newgrp docker
```

## One-Line Fix

If you just need to deploy NOW without logging out:

```bash
# Run the deployment script with sudo
cd /var/www/myapp
sudo bash .github/scripts/deploy-docker.sh
```

The updated script will automatically detect permission issues and use sudo when needed.

## Updated Files

The following files have been updated and should be committed:

1. **`.github/scripts/deploy-docker.sh`** - Now handles Docker permissions automatically
2. **`docker-compose.prod.yml`** - Removed obsolete `version` attribute

## Commit and Redeploy

```bash
# Commit the fixes
git add .
git commit -m "Fix Docker permissions and remove obsolete version attribute"
git push origin main

# GitHub Actions will automatically deploy
# OR manually trigger deployment from GitHub Actions UI
```

## Prevention

After the fix, future deployments won't have this issue because:
- The script now checks for Docker permissions
- Automatically adds user to docker group
- Uses sudo for Docker commands when necessary

## Verify Fix

After deployment, verify everything works:

```bash
ssh your-user@your-ec2-host
cd /var/www/myapp

# Check containers are running
docker compose -f docker-compose.prod.yml ps

# Should show all containers as "Up" and "healthy"
```

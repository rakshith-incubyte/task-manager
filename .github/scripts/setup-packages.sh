#!/bin/bash
set -e

# Check if any packages need installation
NEEDS_UPDATE=false
PACKAGES_TO_INSTALL=()

# Check required packages
for pkg in postgresql-client curl debian-keyring debian-archive-keyring apt-transport-https software-properties-common; do
  if ! dpkg -s $pkg >/dev/null 2>&1; then
    PACKAGES_TO_INSTALL+=("$pkg")
    NEEDS_UPDATE=true
  fi
done

# Check Python packages
if ! dpkg -s python3.14 >/dev/null 2>&1 || ! dpkg -s python3.14-venv >/dev/null 2>&1; then
  if ! dpkg -s python3.14 >/dev/null 2>&1; then
    PACKAGES_TO_INSTALL+=("python3.14")
  fi
  if ! dpkg -s python3.14-venv >/dev/null 2>&1; then
    PACKAGES_TO_INSTALL+=("python3.14-venv")
  fi
  NEEDS_UPDATE=true
fi

# Only run apt-get update if packages need to be installed
if [ "$NEEDS_UPDATE" = true ]; then
  echo "Updating package lists..."
  sudo apt-get update 2>&1 | grep -v "^W:" || true
  
  # Install all missing packages at once
  if [ ${#PACKAGES_TO_INSTALL[@]} -gt 0 ]; then
    echo "Installing packages: ${PACKAGES_TO_INSTALL[*]}"
    sudo apt-get install -y "${PACKAGES_TO_INSTALL[@]}" 2>/dev/null || echo "Warning: Some packages failed to install"
  fi
else
  echo "All required packages already installed, skipping apt-get update"
fi

# Install Node.js 22.x only if not present or wrong version
if command -v node >/dev/null 2>&1 && node --version | grep -q "v22"; then
  echo "Node.js 22.x already installed: $(node --version)"
else
  echo "Installing Node.js 22.x..."
  curl -fsSL https://deb.nodesource.com/setup_22.x 2>/dev/null | sudo -E bash - || echo "Warning: Node.js repo setup failed"
  sudo apt-get install -y nodejs 2>/dev/null || echo "Warning: nodejs installation failed"
fi

# Install Caddy only if not present
if command -v caddy >/dev/null 2>&1; then
  echo "Caddy already installed: $(caddy version 2>/dev/null | head -n1 || echo 'version unknown')"
else
  echo "Installing Caddy..."
  if [ ! -f /usr/share/keyrings/caddy-stable-archive-keyring.gpg ]; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' 2>/dev/null | sudo gpg --batch --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null || echo "Warning: Caddy GPG key import failed"
  fi
  if [ ! -f /etc/apt/sources.list.d/caddy-stable.list ]; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' 2>/dev/null | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null || echo "Warning: Caddy repo setup failed"
    sudo apt-get update 2>&1 | grep -v "^W:" || true
  fi
  sudo apt-get install -y caddy 2>/dev/null || echo "Warning: Caddy installation failed"
fi

# Create deployment directory
sudo mkdir -p $DEPLOY_PATH
sudo chown -R $USER:$USER $DEPLOY_PATH

echo "Deployment directory ready"

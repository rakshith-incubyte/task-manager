#!/bin/bash
set -e

# Create Caddyfile from template
echo "Creating Caddyfile from template..."
sed -e "s/CADDY_EMAIL/$EMAIL/g" \
    -e "s/CADDY_DOMAIN/$DOMAIN/g" \
    $DEPLOY_PATH/.github/Caddyfile.template | \
    sudo tee /etc/caddy/Caddyfile > /dev/null

# Validate Caddyfile
echo "Validating Caddyfile..."
sudo caddy validate --config /etc/caddy/Caddyfile || {
  echo "ERROR: Caddyfile validation failed"
  echo "=== Caddyfile contents ==="
  sudo cat /etc/caddy/Caddyfile
  exit 1
}

# Create log directory
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy 2>/dev/null || echo "Warning: Failed to set caddy log ownership"

# Restart Caddy
sudo systemctl enable caddy 2>/dev/null || true
sudo systemctl restart caddy || {
  echo "ERROR: Failed to restart Caddy"
  echo "=== Caddyfile contents ==="
  sudo cat /etc/caddy/Caddyfile
  echo "=== Caddy logs ==="
  sudo journalctl -u caddy -n 50 --no-pager
  exit 1
}

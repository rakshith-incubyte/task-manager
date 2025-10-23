#!/bin/bash
set -e

# Verify uvicorn exists
if [ ! -f "$DEPLOY_PATH/$FASTAPI_DIR/.venv/bin/uvicorn" ]; then
  echo "ERROR: uvicorn not found in virtualenv"
  exit 1
fi

# Create FastAPI systemd service
sudo tee /etc/systemd/system/fastapi.service > /dev/null <<EOF
[Unit]
Description=FastAPI Application
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$DEPLOY_PATH/$FASTAPI_DIR
Environment="PATH=$DEPLOY_PATH/$FASTAPI_DIR/.venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=$DEPLOY_PATH/$FASTAPI_DIR/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
KillSignal=SIGQUIT
TimeoutStopSec=5
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Create Next.js systemd service
sudo tee /etc/systemd/system/nextjs.service > /dev/null <<EOF
[Unit]
Description=Next.js Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_PATH/$NEXTJS_DIR
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable services (only needed on first deploy)
sudo systemctl enable fastapi nextjs 2>/dev/null || true

# Graceful restart with health checks
echo "Restarting FastAPI..."
sudo systemctl restart fastapi || {
  echo "ERROR: Failed to restart FastAPI"
  sudo journalctl -u fastapi -n 50 --no-pager
  exit 1
}

# Wait for FastAPI to be healthy
sleep 3
for i in {1..10}; do
  if curl -f http://localhost:8000/docs >/dev/null 2>&1 || \
     curl -f http://localhost:8000/health >/dev/null 2>&1 || \
     curl -f http://localhost:8000/ >/dev/null 2>&1; then
    echo "FastAPI is healthy"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "WARNING: FastAPI health check failed"
    sudo systemctl status fastapi --no-pager
  fi
  sleep 2
done

echo "Restarting Next.js..."
sudo systemctl restart nextjs || {
  echo "ERROR: Failed to restart Next.js"
  sudo journalctl -u nextjs -n 50 --no-pager
  exit 1
}

# Wait for Next.js to be healthy
sleep 3
for i in {1..10}; do
  if curl -f http://localhost:3000/ >/dev/null 2>&1; then
    echo "Next.js is healthy"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "WARNING: Next.js health check failed"
    sudo systemctl status nextjs --no-pager
  fi
  sleep 2
done

# Reload Caddy configuration
echo "Reloading Caddy..."
sudo systemctl reload caddy 2>/dev/null || sudo systemctl restart caddy || {
  echo "WARNING: Caddy reload/restart failed"
  sudo systemctl status caddy --no-pager
}

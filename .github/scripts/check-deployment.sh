#!/bin/bash

echo "=== FastAPI Status ==="
sudo systemctl status fastapi --no-pager || true

echo "=== Next.js Status ==="
sudo systemctl status nextjs --no-pager || true

echo "=== Caddy Status ==="
sudo systemctl status caddy --no-pager || true

echo ""
echo "=== Network Diagnostics ==="
echo "Checking if services are listening on correct ports..."
sudo netstat -tlnp | grep -E ':(80|443|3000|8000)' || echo "No services found on expected ports"

echo ""
echo "=== Firewall Status ==="
sudo ufw status verbose 2>/dev/null || echo "UFW not active or not installed"

echo ""
echo "=== Local Service Tests ==="
echo "Testing FastAPI (localhost:8000):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8000/ 2>&1 || echo "FastAPI not responding"

echo "Testing Next.js (localhost:3000):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000/ 2>&1 || echo "Next.js not responding"

echo "Testing Caddy (localhost:80):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/ 2>&1 || echo "Caddy not responding on port 80"

echo ""
echo "=== Caddy Configuration Test ==="
sudo caddy validate --config /etc/caddy/Caddyfile 2>&1 || echo "Caddyfile validation failed"

echo ""
echo "=== Recent Caddy Logs ==="
sudo journalctl -u caddy -n 20 --no-pager || true

echo ""
echo "=== Application URLs ==="
echo "Frontend: https://$DOMAIN"
echo "API: https://$DOMAIN/api"
echo ""
echo "IMPORTANT: Ensure EC2 Security Group allows inbound traffic on ports 80 and 443"

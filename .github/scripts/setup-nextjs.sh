#!/bin/bash
set -e

cd $DEPLOY_PATH/$NEXTJS_DIR

# Verify Node.js is installed
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js not found"
  exit 1
fi
echo "Node.js version: $(node --version)"

# Install pnpm if not already installed
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Installing pnpm..."
  sudo npm install -g pnpm || {
    echo "ERROR: pnpm installation failed"
    exit 1
  }
fi
echo "pnpm version: $(pnpm --version)"

# Create .env.local for Next.js
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
EOF

# Install dependencies and build
echo "Installing Node.js dependencies..."
pnpm install --frozen-lockfile || {
  echo "ERROR: pnpm install failed"
  exit 1
}

echo "Building Next.js application..."
pnpm run build || {
  echo "ERROR: Next.js build failed"
  exit 1
}

# Test if build was successful
if [ ! -d ".next" ]; then
  echo "ERROR: Next.js build failed"
  exit 1
fi

echo "Next.js build successful"

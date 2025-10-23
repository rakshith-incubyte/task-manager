#!/bin/bash
set -e

cd $DEPLOY_PATH/$FASTAPI_DIR

# Install Poetry if not already installed
if ! command -v poetry &> /dev/null; then
  echo "Installing Poetry..."
  curl -sSL https://install.python-poetry.org 2>/dev/null | python3.14 - || {
    echo "ERROR: Poetry installation failed"
    exit 1
  }
  export PATH="$HOME/.local/bin:$PATH"
fi

# Verify Poetry is available
if ! command -v poetry &> /dev/null; then
  echo "ERROR: Poetry not found after installation"
  exit 1
fi

# Configure Poetry to create venv in project directory
poetry config virtualenvs.in-project true

# Install/update dependencies with Poetry
echo "Installing Python dependencies..."
poetry install --only main --no-interaction --no-ansi 2>/dev/null || \
poetry install --no-interaction --no-ansi || {
  echo "ERROR: Poetry install failed"
  exit 1
}

# Create .env file for FastAPI
cat > .env <<EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST/$DB_NAME
SECRET_KEY=$SECRET_KEY
DEBUG=false
EOF

# Test if FastAPI can start
echo "Testing FastAPI startup..."
timeout 10 poetry run python -c "from app.main import app; print('FastAPI loads successfully')" 2>&1 || {
  echo "WARNING: FastAPI startup test failed, but continuing deployment"
}

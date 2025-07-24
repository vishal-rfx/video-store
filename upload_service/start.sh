#!/bin/bash
set -e

echo "Running database migrations..."

# Change to the directory containing alembic.ini
cd /app

# Run migrations with explicit path
alembic upgrade head

echo "Starting FastAPI application..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
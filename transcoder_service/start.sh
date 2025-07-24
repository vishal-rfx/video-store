#!/bin/bash
set -e

# Get delay from environment variable, default to 30 seconds
STARTUP_DELAY=${STARTUP_DELAY:-30}

echo "Waiting for dependencies to be ready (${STARTUP_DELAY} seconds)..."
sleep $STARTUP_DELAY

echo "Starting transcoder service..."
exec python main.py
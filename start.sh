#!/bin/sh
set -e

echo "Starting CareLinkMN..."

# Start API server in background with proper working directory
echo "Starting API server on port 3001..."
NODE_ENV=production node /app/packages/api/dist/index.js &
API_PID=$!

# Wait for API to start
sleep 3

# Start Next.js web app with proper environment
echo "Starting Next.js on port 3000..."
cd /app/apps/web || exit 1
exec NODE_ENV=production /app/node_modules/.bin/next start

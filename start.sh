#!/bin/sh
set -e

echo "Starting CareLinkMN..."

# Start API server in background
echo "Starting API server on port 3001..."
NODE_ENV=production node /app/packages/api/dist/index.js &
API_PID=$!

# Wait for API to start
sleep 3

# Start Next.js web app - Next.js needs to be in its directory
echo "Starting Next.js on port 3000..."
exec sh -c 'cd /app/apps/web && exec node /app/node_modules/.bin/next start'

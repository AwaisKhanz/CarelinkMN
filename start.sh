#!/bin/sh
set -e

echo "Starting CareLinkMN..."

# Start API server in background
echo "Starting API server on port 3001..."
(cd /app/packages/api && node dist/index.js) &

# Wait a moment for API to start
sleep 2

# Start Next.js web app
echo "Starting Next.js on port 3000..."
cd /app/apps/web && exec node_modules/.bin/next start

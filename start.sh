#!/bin/sh
set -e

echo "Starting CareLinkMN..."

# Start API server in background
cd /app/packages/api
echo "Starting API server on port 3001..."
node dist/index.js &

# Start Next.js web app
cd /app/apps/web
echo "Starting Next.js on port 3000..."
exec pnpm start

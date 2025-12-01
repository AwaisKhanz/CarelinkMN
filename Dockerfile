# Multi-stage build for CareLinkMN
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN pnpm install

# Generate Prisma Client
RUN pnpm --filter @carelink/database db:generate

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@8

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

# Install production dependencies only
RUN pnpm install --prod

# Copy built application
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/node_modules ./node_modules

# Set working directory to web app
WORKDIR /app/apps/web

# Expose ports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start Next.js (which includes API routes)
CMD ["node_modules/.bin/next", "start"]

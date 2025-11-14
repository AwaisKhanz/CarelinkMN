# Environment Setup Instructions

## Quick Setup

Run these commands to create the necessary environment files:

### 1. Create Root .env file
```bash
cp env.example .env
```

### 2. Create Web App .env.local
```bash
cat > apps/web/.env.local << 'EOF'
# Next.js App Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/carelinkmn"

# App Configuration
NODE_ENV="development"
EOF
```

### 3. Create API Server .env
```bash
cat > packages/api/.env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/carelinkmn"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server Configuration
PORT=3001
NODE_ENV="development"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
```

## What Each File Does

### Root .env
- Contains shared environment variables
- Used by all packages and services
- Includes database URL, external service keys, etc.

### apps/web/.env.local
- Next.js specific environment variables
- Contains API URL for frontend requests
- Used by the web application

### packages/api/.env
- Express API server environment variables
- Contains JWT secrets and server configuration
- Used by the backend API

## After Setup

1. **Start Development Servers**:
   ```bash
   npm run dev
   ```

2. **Verify Everything Works**:
   - API Server: http://localhost:3001/health
   - Web App: http://localhost:3000
   - Authentication should work between them

## Troubleshooting

If you get connection errors:
1. Make sure PostgreSQL is running
2. Check that the database URL is correct
3. Verify ports 3000 and 3001 are available
4. Check browser console for CORS errors

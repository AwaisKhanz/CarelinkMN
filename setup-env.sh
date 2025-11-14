#!/bin/bash

echo "🔧 Setting up CareLinkMN environment files..."

# Create .env file from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "✅ Created .env file"
else
    echo "⚠️  .env file already exists, skipping..."
fi

# Create .env.local for web app
if [ ! -f apps/web/.env.local ]; then
    echo "📝 Creating apps/web/.env.local..."
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
    echo "✅ Created apps/web/.env.local"
else
    echo "⚠️  apps/web/.env.local already exists, skipping..."
fi

# Create .env for API server
if [ ! -f packages/api/.env ]; then
    echo "📝 Creating packages/api/.env..."
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
    echo "✅ Created packages/api/.env"
else
    echo "⚠️  packages/api/.env already exists, skipping..."
fi

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review and update the .env files with your actual values"
echo "   2. Make sure PostgreSQL is running"
echo "   3. Run: npm run dev"
echo ""
echo "📁 Created files:"
echo "   - .env (root)"
echo "   - apps/web/.env.local"
echo "   - packages/api/.env"

# CareLinkMN - Minnesota Care Coordination Platform

A comprehensive care coordination platform connecting families, case managers, and licensed care providers through intelligent, payer-aware search with real-time availability tracking.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for local development)

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd carelinkmn
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start development services:**
   ```bash
   # Option 1: Using Docker (recommended)
   cd infrastructure/docker
   docker-compose -f docker-compose.dev.yml up -d
   
   # Option 2: Local services
   # Start PostgreSQL and Redis locally
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   pnpm db:generate
   
   # Run database migrations
   pnpm db:migrate
   
   # Seed the database
   pnpm db:seed
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

## 🏗️ Project Structure

```
carelinkmn/
├── apps/
│   ├── web/                 # Next.js web application
│   ├── admin/               # Admin dashboard
│   └── mobile/              # Mobile app (future)
├── packages/
│   ├── database/            # Prisma schema and database client
│   ├── api/                 # tRPC API layer
│   ├── auth/                # Authentication package
│   ├── ui/                  # Shared UI components
│   ├── utils/               # Shared utilities
│   └── types/               # Shared TypeScript types
├── services/
│   ├── search/              # Search service
│   ├── ai/                  # AI/ML services
│   ├── notifications/       # Email/SMS services
│   └── analytics/           # Analytics service
└── infrastructure/
    ├── docker/              # Docker configurations
    ├── terraform/           # Infrastructure as code
    └── scripts/             # Deployment scripts
```

## 🛠️ Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build all packages
- `pnpm test` - Run tests
- `pnpm lint` - Run linter
- `pnpm typecheck` - Run TypeScript checks
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:studio` - Open Prisma Studio

## 🔧 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components
- **Framer Motion** - Animations
- **Zustand** - State management
- **TanStack Query** - Data fetching

### Backend
- **Node.js** - Runtime
- **tRPC** - Type-safe APIs
- **PostgreSQL** - Primary database
- **Prisma** - ORM
- **Redis** - Caching and sessions
- **NextAuth.js** - Authentication

### Infrastructure
- **Railway** - Hosting and deployment
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Sentry** - Error monitoring
- **PostHog** - Analytics

## 📋 Features

### Core Features
- **Sub-1 Second Search** - Lightning-fast provider search
- **Real-time Availability** - Live opening tracking
- **AI-powered Matching** - Intelligent care placement
- **Payer-aware Search** - Insurance compatibility
- **Multi-role System** - Admin, Provider, Case Manager, etc.

### Provider Management
- **Multi-facility Support** - Manage multiple homes
- **Real-time Updates** - Live availability changes
- **License Management** - Track certifications
- **Analytics Dashboard** - Performance insights

### Care Coordination
- **Referral Management** - Streamlined referrals
- **Hospital Discharge** - Emergency placement
- **Messaging System** - Secure communication
- **Audit Logging** - Compliance tracking

## 🔐 Security & Compliance

- **HIPAA Compliant** - PHI protection
- **Row-level Security** - Database-level access control
- **Audit Logging** - Complete action tracking
- **Encryption** - Data at rest and in transit
- **Role-based Access** - Granular permissions

## 🚀 Deployment

### Staging
```bash
pnpm build
pnpm deploy:staging
```

### Production
```bash
pnpm build
pnpm deploy:production
```

## 📊 Performance Targets

- **Search Response**: < 1 second
- **Page Load**: < 2 seconds
- **API Response**: < 200ms
- **AI Matching**: < 5 seconds
- **Cache Hit Rate**: > 80%

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@carelinkmn.com or create an issue in the repository.

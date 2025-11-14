# Deployment Guide

This guide covers deploying CareLinkMN to Railway and other platforms.

## 🚀 Railway Deployment

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install with `npm install -g @railway/cli`
3. **Environment Variables**: Set up required secrets

### Quick Start

```bash
# Deploy to staging
./scripts/deploy-railway.sh staging $RAILWAY_TOKEN

# Deploy to production
./scripts/deploy-railway.sh production $RAILWAY_TOKEN
```

### Manual Deployment

1. **Login to Railway**
   ```bash
   railway login
   ```

2. **Create Project**
   ```bash
   railway init
   ```

3. **Add Services**
   ```bash
   # Add PostgreSQL
   railway add postgresql
   
   # Add Redis
   railway add redis
   
   # Add web service
   railway add
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set NEXTAUTH_SECRET=your-secret
   railway variables set JWT_SECRET=your-jwt-secret
   railway variables set JWT_REFRESH_SECRET=your-refresh-secret
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Environment Variables

#### Required Variables
- `NODE_ENV` - Environment (production/staging)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh secret
- `NEXTAUTH_URL` - Application URL

#### Optional Variables
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `SENDGRID_API_KEY` - Email service
- `TWILIO_ACCOUNT_SID` - SMS service
- `SENTRY_DSN` - Error monitoring
- `POSTHOG_KEY` - Analytics

### Database Setup

1. **Run Migrations**
   ```bash
   railway run pnpm db:migrate
   ```

2. **Seed Database**
   ```bash
   railway run pnpm db:seed
   ```

3. **Open Prisma Studio**
   ```bash
   railway run pnpm db:studio
   ```

### Health Checks

The application includes a health check endpoint at `/api/health` that returns:
- Application status
- Uptime
- Version information
- Environment details

### Monitoring

#### Railway Dashboard
- View logs: `railway logs`
- Monitor metrics: Railway dashboard
- Check deployments: Railway dashboard

#### Application Monitoring
- Health endpoint: `GET /api/health`
- Metrics endpoint: `GET /api/metrics` (future)
- Status page: `GET /status` (future)

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t carelinkmn .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e REDIS_URL="redis://host:6379" \
  -e NEXTAUTH_SECRET="your-secret" \
  carelinkmn
```

### Docker Compose
```bash
docker-compose up -d
```

## 🔧 Environment-Specific Configuration

### Staging
- URL: `https://carelink-staging.railway.app`
- Database: `carelink_staging`
- Redis: Staging instance
- Monitoring: Basic

### Production
- URL: `https://carelinkmn.com`
- Database: `carelink_prod`
- Redis: Production instance
- Monitoring: Full (Sentry, PostHog)

## 📊 Performance Optimization

### Build Optimization
- Tree shaking enabled
- Code splitting
- Image optimization
- Bundle analysis

### Runtime Optimization
- Redis caching
- Database connection pooling
- CDN for static assets
- Compression enabled

### Monitoring
- Response time tracking
- Error rate monitoring
- Database query performance
- Memory usage tracking

## 🔒 Security

### HTTPS
- Automatic SSL certificates
- HSTS headers
- Secure cookies

### Environment Security
- Secrets management
- Environment variable encryption
- Access control

### Application Security
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+)
   - Verify pnpm version (8+)
   - Clear cache: `pnpm clean`

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Verify credentials

3. **Redis Connection Issues**
   - Verify REDIS_URL format
   - Check Redis service status
   - Verify network access

4. **Deployment Failures**
   - Check Railway logs
   - Verify environment variables
   - Check build output

### Debug Commands

```bash
# Check Railway status
railway status

# View logs
railway logs --service web

# Connect to database
railway connect postgresql

# Run shell in service
railway shell

# Check environment variables
railway variables
```

### Rollback

```bash
# Rollback to previous deployment
railway rollback

# Deploy specific commit
railway up --detach <commit-hash>
```

## 📈 Scaling

### Horizontal Scaling
- Multiple Railway services
- Load balancer configuration
- Database read replicas

### Vertical Scaling
- Increase service resources
- Database performance tuning
- Redis memory optimization

### Auto-scaling
- Railway auto-scaling
- Custom scaling policies
- Performance-based scaling

## 🔄 CI/CD Integration

### GitHub Actions
- Automatic deployment on push
- Environment-specific deployments
- Rollback on failure

### Manual Deployment
- Railway CLI commands
- Custom deployment scripts
- Blue-green deployments

## 📝 Maintenance

### Regular Tasks
- Database backups
- Log rotation
- Security updates
- Performance monitoring

### Updates
- Application updates
- Dependency updates
- Security patches
- Feature releases

## 🆘 Support

### Documentation
- [Railway Docs](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

### Community
- [Railway Discord](https://discord.gg/railway)
- [GitHub Issues](https://github.com/carelinkmn/carelinkmn/issues)
- [Support Email](mailto:support@carelinkmn.com)

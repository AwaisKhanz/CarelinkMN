# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the CareLinkMN project.

## Workflows

### 🔄 CI (Continuous Integration)
**File:** `ci.yml`
**Triggers:** Push to main/develop, Pull requests

**Stages:**
1. **Lint & Typecheck** - Code quality checks
2. **Test** - Unit and integration tests with PostgreSQL & Redis
3. **Build** - Build all packages and applications
4. **E2E** - End-to-end tests with Playwright

**Services:**
- PostgreSQL 15 with PostGIS
- Redis 7
- Test database setup and migrations

### 🚀 Deploy to Staging
**File:** `deploy-staging.yml`
**Triggers:** Push to develop branch, Manual dispatch

**Process:**
1. Build application
2. Deploy to Railway staging environment
3. Run database migrations
4. Health check verification
5. Slack notification

### 🏭 Deploy to Production
**File:** `deploy-production.yml`
**Triggers:** Push to main branch, Tags (v*), Manual dispatch

**Process:**
1. Run full test suite
2. Build application
3. Deploy to Railway production environment
4. Run database migrations
5. Health check verification
6. Create GitHub release (for tags)
7. Slack notification

### 🔒 Security
**File:** `security.yml`
**Triggers:** Push to main/develop, PRs, Weekly schedule

**Checks:**
- **Dependency Scan** - pnpm audit, Snyk vulnerability scan
- **Code Security** - Trivy filesystem scan
- **Secrets Scan** - TruffleHog secret detection

### ⚡ Performance
**File:** `performance.yml`
**Triggers:** Push to main, PRs, Manual dispatch

**Tests:**
- **Lighthouse CI** - Web performance, accessibility, SEO
- **K6 Load Tests** - API and search endpoint performance
- **Custom Metrics** - Response time and error rate thresholds

## Environment Variables

### Required Secrets
- `TURBO_TOKEN` - Turborepo token for caching
- `RAILWAY_TOKEN` - Railway deployment token
- `SNYK_TOKEN` - Snyk security scanning token
- `SLACK_WEBHOOK` - Slack notifications webhook

### Database URLs
- `STAGING_DATABASE_URL` - Staging PostgreSQL connection
- `PRODUCTION_DATABASE_URL` - Production PostgreSQL connection
- `TEST_DATABASE_URL` - Test PostgreSQL connection

### Redis URLs
- `STAGING_REDIS_URL` - Staging Redis connection
- `PRODUCTION_REDIS_URL` - Production Redis connection
- `TEST_REDIS_URL` - Test Redis connection

### Authentication
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh secret

### URLs
- `STAGING_URL` - Staging environment URL
- `PRODUCTION_URL` - Production environment URL

## Performance Thresholds

### Lighthouse CI
- Performance: ≥ 90%
- Accessibility: ≥ 90%
- Best Practices: ≥ 90%
- SEO: ≥ 90%
- FCP: ≤ 2000ms
- LCP: ≤ 2500ms
- CLS: ≤ 0.1
- TBT: ≤ 300ms

### K6 Load Tests
- API Response Time: 95th percentile < 500ms
- Search Response Time: 95th percentile < 1000ms
- Error Rate: < 5%
- Search Error Rate: < 5%

## Artifacts

### Build Artifacts
- `build-artifacts` - Compiled applications and packages
- `e2e-results` - Playwright test results and reports
- `performance-results` - Lighthouse and K6 test results

### Retention
- Build artifacts: 7 days
- E2E results: 7 days
- Performance results: 30 days

## Monitoring

### Health Checks
- Application health endpoint: `/api/health`
- Database connectivity
- Redis connectivity
- Response time validation

### Notifications
- Slack channel: `#deployments`
- Deployment status updates
- Error notifications
- Performance regression alerts

## Local Development

### Running Tests
```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run performance tests
pnpm performance
```

### Database Commands
```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

### Build Commands
```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=@carelink/web

# Clean build artifacts
pnpm clean
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (requires 18+)
   - Verify pnpm version (requires 8+)
   - Clear cache: `pnpm clean`

2. **Test Failures**
   - Ensure database is running
   - Check environment variables
   - Verify test data setup

3. **Deployment Issues**
   - Check Railway service status
   - Verify environment variables
   - Review migration logs

4. **Performance Issues**
   - Check Lighthouse thresholds
   - Review K6 load test results
   - Analyze database query performance

### Debug Mode
Set `ACTIONS_STEP_DEBUG: true` in repository secrets to enable debug logging.

# Production Migration Guide

## ⚠️ Critical: Zero-Downtime Production Deployment

This guide ensures **safe database migrations** in production with **zero data loss**.

---

## Pre-Deployment Checklist

### 1. Backup Your Production Database

**ALWAYS backup before any migration!**

```bash
# PostgreSQL backup command
pg_dump -h <production-host> -U <username> -d carelinkmn -F c -b -v -f "backup_$(date +%Y%m%d_%H%M%S).dump"

# Or using environment variables
pg_dump $DATABASE_URL -F c -b -v -f "backup_$(date +%Y%m%d_%H%M%S).dump"
```

**Store backups securely** with retention policy (keep last 7 days minimum).

### 2. Test Migrations in Staging

```bash
# 1. Clone production database to staging
pg_dump $PRODUCTION_DATABASE_URL | psql $STAGING_DATABASE_URL

# 2. Run migrations on staging
cd packages/database
npx prisma migrate deploy

# 3. Verify application works
npm run dev
```

### 3. Review Migration SQL

```bash
# View the SQL that will be executed
cat packages/database/prisma/migrations/<migration-name>/migration.sql
```

---

## Production Migration Process

### Step 1: Prepare Migration Files (Development)

```bash
# In development environment
cd packages/database

# Create migration (this generates SQL files)
npx prisma migrate dev --name descriptive_migration_name

# This creates: packages/database/prisma/migrations/YYYYMMDDHHMMSS_descriptive_migration_name/
```

**Important**: 
- ✅ Commit migration files to git
- ✅ Never modify migration files after creation
- ✅ Use descriptive names (e.g., `add_user_lockout_fields`)

### Step 2: Deploy to Production

**Use `prisma migrate deploy` (NOT `prisma migrate dev`)**

```bash
# On production server or CI/CD pipeline
cd packages/database

# Set production database URL
export DATABASE_URL="postgresql://user:password@production-host:5432/carelinkmn"

# Deploy migrations (safe for production)
npx prisma migrate deploy
```

**Why `migrate deploy`?**
- ✅ Only applies pending migrations
- ✅ Never resets the database
- ✅ Never prompts for user input
- ✅ Safe for CI/CD automation
- ❌ Does NOT create new migrations

### Step 3: Verify Deployment

```bash
# Check migration status
npx prisma migrate status

# Expected output:
# Database schema is up to date!
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Backup Database
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
        run: |
          pg_dump $DATABASE_URL -F c -b -v -f "backup_$(date +%Y%m%d_%H%M%S).dump"
          # Upload backup to S3/storage
      
      - name: Run Database Migrations
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
        run: |
          cd packages/database
          npx prisma migrate deploy
      
      - name: Generate Prisma Client
        run: |
          cd packages/database
          npx prisma generate
      
      - name: Deploy Application
        run: |
          # Your deployment commands here
          npm run build
          # Deploy to Vercel/AWS/etc.
```

---

## Migration Best Practices

### ✅ DO

1. **Always backup before migrations**
2. **Test in staging first**
3. **Use `prisma migrate deploy` in production**
4. **Commit migration files to version control**
5. **Use descriptive migration names**
6. **Review generated SQL before deploying**
7. **Monitor application after deployment**
8. **Have a rollback plan**

### ❌ DON'T

1. **Never use `prisma migrate dev` in production**
2. **Never use `prisma db push` in production** (skips migration history)
3. **Never modify existing migration files**
4. **Never delete migration files**
5. **Never run migrations without a backup**
6. **Don't deploy during peak hours** (if possible)

---

## Handling Schema Drift

**Schema drift** = Database structure doesn't match migration history

### Detection

```bash
npx prisma migrate status

# If drift detected, you'll see:
# "Database schema is not in sync with migration history"
```

### Resolution (Production)

**Option 1: Create Baseline Migration** (Recommended for existing production)

```bash
# 1. Mark all existing migrations as applied (without running them)
npx prisma migrate resolve --applied "migration_name"

# 2. Create new migration for any remaining changes
npx prisma migrate dev --name fix_schema_drift
```

**Option 2: Reset (ONLY for development/staging)**

```bash
# ⚠️ NEVER DO THIS IN PRODUCTION - DELETES ALL DATA
npx prisma migrate reset
```

---

## Rollback Strategy

### If Migration Fails

1. **Stop the application immediately**
2. **Restore from backup**:

```bash
# Restore PostgreSQL backup
pg_restore -h <host> -U <user> -d carelinkmn -v backup_file.dump
```

3. **Revert code to previous version**
4. **Investigate issue in staging**

### Rollback Migration (Advanced)

If you need to undo a migration:

```bash
# 1. Create a new migration that reverses the changes
npx prisma migrate dev --name revert_previous_migration

# 2. Manually write SQL to undo changes in the new migration file
```

**Note**: Prisma doesn't support automatic rollbacks. You must create a new "undo" migration.

---

## Common Production Scenarios

### Scenario 1: Adding a New Column

**Safe Migration**:
```sql
-- Add column with default value
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER DEFAULT 0;
```

**Why it's safe**: 
- ✅ Doesn't require data migration
- ✅ Default value prevents NULL issues
- ✅ No downtime

### Scenario 2: Renaming a Column

**Risky - Use Blue-Green Deployment**:

```sql
-- Step 1: Add new column
ALTER TABLE "User" ADD COLUMN "newColumnName" TEXT;

-- Step 2: Copy data
UPDATE "User" SET "newColumnName" = "oldColumnName";

-- Step 3: Deploy code that uses new column
-- (Keep old column for now)

-- Step 4: After verification, drop old column
ALTER TABLE "User" DROP COLUMN "oldColumnName";
```

### Scenario 3: Adding Foreign Key

**Safe Migration**:
```sql
-- Add column first (nullable)
ALTER TABLE "Referral" ADD COLUMN "assignedToId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Referral" 
  ADD CONSTRAINT "Referral_assignedToId_fkey" 
  FOREIGN KEY ("assignedToId") 
  REFERENCES "User"("id") 
  ON DELETE SET NULL;
```

---

## Monitoring & Alerts

### Post-Migration Checks

```bash
# 1. Verify migration status
npx prisma migrate status

# 2. Check database connectivity
npx prisma db execute --stdin <<< "SELECT 1;"

# 3. Verify critical tables exist
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\";"

# 4. Check application logs
tail -f /var/log/application.log
```

### Set Up Alerts

- **Database connection errors**
- **Migration failures**
- **Slow queries after migration**
- **Application errors**

---

## Emergency Contacts & Procedures

### If Something Goes Wrong

1. **Immediately notify team**
2. **Stop deployments**
3. **Check application logs**
4. **Verify database connectivity**
5. **Consider rollback if critical**

### Rollback Decision Tree

```
Is the application broken?
├─ YES → Rollback immediately
└─ NO → Can it wait?
    ├─ YES → Fix in next deployment
    └─ NO → Hot-fix deployment
```

---

## Production Migration Checklist

Use this checklist for every production deployment:

- [ ] Backup production database
- [ ] Test migration in staging environment
- [ ] Review migration SQL files
- [ ] Notify team of deployment window
- [ ] Set up monitoring/alerts
- [ ] Run `npx prisma migrate deploy`
- [ ] Verify migration status
- [ ] Deploy application code
- [ ] Monitor application logs (15 minutes)
- [ ] Verify critical user flows
- [ ] Document any issues
- [ ] Keep backup for 7 days

---

## Additional Resources

- **Prisma Migration Docs**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **PostgreSQL Backup**: https://www.postgresql.org/docs/current/backup.html
- **Zero-Downtime Deployments**: https://www.prisma.io/docs/guides/deployment/deployment-guides

---

## Support

For migration issues:
1. Check Prisma migration status: `npx prisma migrate status`
2. Review migration logs
3. Contact DevOps team
4. Escalate to database administrator if needed

---

*Last Updated: November 2024*
*Review this guide before every production deployment*

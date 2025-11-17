# Clearing the Database

## Why You Can't Delete Records Directly

The database uses **foreign key constraints** with `ON DELETE RESTRICT` to maintain data integrity. This means:

- ❌ You **cannot** delete an `Organization` if there are `Users`, `CaseManagers`, or `Providers` referencing it
- ❌ You **cannot** delete a `User` if there are `Messages`, `Referrals`, `AuditLogs`, etc. referencing it
- ❌ You **cannot** delete a `Provider` if there are `Homes`, `Licenses`, `Openings`, etc. referencing it

This is by design to prevent orphaned records and maintain data consistency.

## Methods to Clear the Database

### Method 1: Using the Clear Database Script (Recommended)

This script deletes all data in the correct order to respect foreign key constraints:

```bash
# From the database package directory
cd packages/database
npm run db:clear

# Or from the root directory
npm run db:clear --workspace=@carelink/database
```

**What it does:**
- Deletes all records from all tables in the correct order
- Uses `TRUNCATE` which is faster than `DELETE` and resets sequences
- Handles all foreign key constraints automatically

### Method 2: Using Prisma Reset (Alternative)

This will **drop the entire database** and recreate it from migrations:

```bash
# From the database package directory
cd packages/database
npm run db:reset

# Or from the root directory
npm run db:reset --workspace=@carelink/database
```

**What it does:**
- Drops all tables
- Re-runs all migrations
- Optionally runs seed script (if configured)

⚠️ **Warning:** This method will **lose all data and schema changes** that aren't in migrations.

### Method 3: Manual Deletion Order (For Specific Records)

If you only want to delete specific records, you must delete in this order:

1. **Child records first:**
   - MessageAttachments
   - Messages
   - MessageThreads
   - AuditLogs
   - Notifications
   - Referrals
   - Placements
   - Openings
   - Homes
   - Licenses
   - ProviderOnboardingState

2. **Then parent records:**
   - Providers
   - CaseManagers
   - HospitalStaff
   - Users

3. **Finally:**
   - Organizations

## Quick Reference

```bash
# Clear all data (keeps schema)
npm run db:clear

# Reset database (drops and recreates)
npm run db:reset

# Open Prisma Studio to view/edit data
npm run db:studio
```

## Troubleshooting

If you get foreign key constraint errors:

1. **Check what's referencing the record:**
   ```sql
   -- Example: Find what references an organization
   SELECT 
     tc.table_schema, 
     tc.table_name, 
     kcu.column_name,
     ccu.table_schema AS foreign_table_schema,
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name 
   FROM information_schema.table_constraints AS tc 
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY' 
     AND ccu.table_name = 'Organization';
   ```

2. **Delete child records first** using the script or manual order above

3. **Use the clear database script** which handles everything automatically


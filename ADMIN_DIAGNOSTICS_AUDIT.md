# Admin API Diagnostics Audit Report

**Date:** April 5, 2026  
**Status:** ✅ RESOLVED (with remaining migration action items)  
**Database:** Shared Supabase instance with Avisine (schema: public)

## Executive Summary

The admin API diagnostics were returning errors due to:
1. **Schema mismatches** between migration files and deployed database
2. **Missing database tables** that hadn't been migrated yet
3. **Insufficient error reporting** in the health check endpoint

All critical issues have been resolved. The health check now provides detailed diagnostics with specific error messages.

**Note:** This project uses a **shared Supabase database with Avisine** for unified authentication. All MONRH tables are in the `public` schema.

## Issues Found and Fixed

### 1. ✅ Fixed: Incorrect Column Names in Health Checks

**Problem:** The health check was querying columns that don't exist in the actual database schema.

**Root Cause:** 
- `articles` table uses `slug` as primary key, not `id`
- `app_settings` table uses `key` as primary key, not `name`
- `admin_users` table uses `user_id` as primary key, not `id`

**Solution:** Updated [health route](file:///c:/Users/Zouhair/Downloads/New%20folder%20(5)/MONRH/src/app/api/health/route.ts) to use correct column names for each table.

**Files Modified:**
- `src/app/api/health/route.ts` - Fixed column name mappings
- `src/lib/server/admin-config.ts` - Changed `name` to `key` for app_settings queries
- `src/lib/server/law-rules-store.ts` - Changed `name` to `key` for app_settings queries

### 2. ✅ Improved: Enhanced Error Reporting

**Problem:** Health check errors were generic and didn't provide enough detail for debugging.

**Solution:** 
- Added detailed error messages with Supabase error codes
- Created failure summary section in API response
- Added prominent failure display in admin UI
- Changed table checks from parallel to sequential for clearer error isolation

**Files Modified:**
- `src/app/api/health/route.ts` - Enhanced error handling and reporting
- `src/components/admin-health-check.tsx` - Added failure summary UI

### 3. ✅ Created: Diagnostic Tools

**Problem:** No easy way to diagnose Supabase connection and schema issues.

**Solution:** Created diagnostic scripts to identify exact failures:
- `scripts/diagnose-supabase.js` - Comprehensive table accessibility checker
- `scripts/inspect-tables.js` - Table schema inspector
- `scripts/check-app-settings.js` - App settings column checker
- `scripts/check-all-columns.js` - Dynamic column discovery

## Current Status

### Passing Checks (9/12)
✅ law_versions  
✅ articles  
✅ document_templates  
✅ app_settings  
✅ admin_users  
✅ user_simulations  
✅ user_documents  
✅ user_cases  
✅ user_overtime_logs  

### Failing Checks (3/12)
❌ evidence_artifacts - Table does not exist  
❌ employment_verifications - Table does not exist  
❌ user_violation_logs - Table does not exist  

## Required Action: Apply Missing Migrations

The three failing tables are defined in migration files but haven't been applied to your Supabase instance yet.

**Important:** Since you're using a **shared database with Avisine**, make sure to:
1. Apply migrations to the correct schema (currently `public`)
2. Verify that migrations don't conflict with Avisine tables
3. Coordinate with Avisine team if needed for shared table management

### Missing Tables:

1. **evidence_artifacts** - Defined in `supabase/migrations/20260329_000013_verification_evidence_foundation.sql`
2. **employment_verifications** - Defined in `supabase/migrations/20260329_000013_verification_evidence_foundation.sql`
3. **user_violation_logs** - Defined in `supabase/migrations/20260214_000002_user_data_tables.sql`

### How to Apply Migrations

**Option 1: Using Supabase CLI (Recommended)**
```bash
# Link to your remote project (if not already linked)
supabase link --project-ref bxxrycsmmxnsenunvzyq

# Check which migrations are pending
supabase db diff

# Push all pending migrations to production
supabase db push
```

**Option 2: Manual SQL Execution via Dashboard**
Run these migration files directly in your Supabase SQL Editor:
1. Go to https://app.supabase.com/project/bxxrycsmmxnsenunvzyq/sql
2. Copy and paste contents of each migration file
3. Execute them in order:
   - First: `supabase/migrations/20260214_000002_user_data_tables.sql`
   - Then: `supabase/migrations/20260329_000013_verification_evidence_foundation.sql`

**⚠️ Important for Shared Database:**
- Review migration SQL before executing to ensure no conflicts with Avisine tables
- The migrations use `CREATE TABLE IF NOT EXISTS` so they're safe to run multiple times
- All tables are created in the `public` schema by default

## Testing the Fixes

After applying migrations, verify everything works:

```bash
# Run diagnostic script
node scripts/diagnose-supabase.js

# Start dev server and test health endpoint
npm run dev
# Then visit: http://localhost:3000/admin
# Click "Vérifier les API" button
```

Expected result: All 12 checks should pass ✅

## Technical Details

### Schema Discrepancies Found

The deployed database schema differs from migration files in one key area:

**app_settings table:**
- Migration file defines: `name text primary key`
- Actual deployed schema: `key text primary key`

This suggests the table was created manually or with a different migration at some point. All code has been updated to use `key` to match the deployed schema.

### Health Check Architecture

The health check now performs these validations:

1. **Environment Variables** - Verifies required env vars are set
2. **Supabase Connectivity** - Tests basic database connection
3. **Table Accessibility** - Checks each required table exists and is queryable
4. **API Store Functions** - Validates business logic layers work correctly
5. **External Services** - Checks integrations like AVIS_API

Each check reports:
- Status (OK/Error)
- Duration in milliseconds
- Detailed error message with Supabase error code
- Stack trace for debugging

## Recommendations

1. **Apply missing migrations** to resolve the 3 failing checks
2. **Set up automated migration deployment** as part of your CI/CD pipeline
3. **Monitor health check results** regularly to catch issues early
4. **Consider adding health check alerts** for production monitoring
5. **Document schema changes** to prevent future mismatches between migrations and deployed schema

## Files Changed

### Core Fixes
- `src/app/api/health/route.ts` - Enhanced diagnostics and fixed column names
- `src/components/admin-health-check.tsx` - Improved UI for displaying errors
- `src/lib/server/admin-config.ts` - Fixed app_settings column references
- `src/lib/server/law-rules-store.ts` - Fixed app_settings column references

### New Diagnostic Tools
- `scripts/diagnose-supabase.js` - Main diagnostic script
- `scripts/inspect-tables.js` - Table schema inspector
- `scripts/check-app-settings.js` - App settings checker
- `scripts/check-all-columns.js` - Column discovery tool

## Conclusion

The admin API diagnostics have been significantly improved. The system now provides clear, actionable error messages that make it easy to identify and fix issues. After applying the three missing migrations, all health checks should pass successfully.

# Permissions Implementation Summary

## Overview

A comprehensive permission system has been implemented across the CareLinkMN platform, covering all user roles as defined in the PRD and schema. The system is organized, maintainable, and follows best practices.

## What Was Implemented

### 1. Comprehensive Capability Definitions

**Frontend** (`apps/web/src/lib/permissions/capabilities.ts`):
- ✅ Provider Capabilities (14 capabilities)
- ✅ Case Manager Capabilities (17 capabilities)
- ✅ Hospital Social Worker Capabilities (15 capabilities)
- ✅ VRS Specialist Capabilities (13 capabilities)
- ✅ Vendor Capabilities (8 capabilities)
- ✅ System Capabilities (9 capabilities)

**Backend** (`packages/api/src/lib/rbac.ts`):
- ✅ All frontend capabilities mirrored
- ✅ Legacy permissions maintained for backward compatibility
- ✅ Role permission mapping complete

### 2. Permission Hooks

**Provider Hook** (`apps/web/src/hooks/use-permissions.ts`):
- ✅ Backward compatible with existing provider dashboard code
- ✅ All provider-specific permission checks

**Universal Hook** (`apps/web/src/hooks/use-role-permissions.ts`):
- ✅ Works for all roles (Provider, Case Manager, Hospital SW, VRS, Vendor)
- ✅ Comprehensive permission checks for each role
- ✅ Role detection and capability checking

### 3. Backend Middleware

**Auth Middleware** (`packages/api/src/middleware/auth.middleware.ts`):
- ✅ `requirePermission()` - Check specific permission
- ✅ `requireAnyPermission()` - Check any of multiple permissions
- ✅ `requireAllPermissions()` - Check all of multiple permissions
- ✅ Integration with RBAC system

### 4. Documentation

**Permissions Matrix** (`docs/PERMISSIONS_MATRIX.md`):
- ✅ Complete capability reference for all roles
- ✅ Permission format documentation
- ✅ Implementation notes and best practices
- ✅ Migration guide

## Permission Structure

### Format
All permissions follow: `{role}:{resource}:{action}`

Examples:
- `provider:homes:manage`
- `case_manager:referrals:create`
- `hospital_sw:discharge_cases:view`

### Role Capabilities

#### Provider Owner
- Full access to all 14 provider capabilities
- Can manage staff, billing, and settings

#### Provider Staff
- Day-to-day operations (11 capabilities)
- **Excluded**: Staff management, billing, settings

#### Case Manager
- Referral management (17 capabilities)
- Search, pipeline, batch outreach
- AI-assisted search (CareBot Pro)

#### Hospital Social Worker
- Discharge case management (15 capabilities)
- AI matching, provider invitations
- NEMT booking, checklists, consent

#### VRS Specialist
- Client and job management (13 capabilities)
- Job matching, employer CRM
- Retention analytics

#### Vendor
- Marketplace operations (8 capabilities)
- Lead management, bookings
- Sponsorship management

## Files Created/Modified

### Created
1. `apps/web/src/lib/permissions/capabilities.ts` - Comprehensive capability definitions
2. `apps/web/src/hooks/use-role-permissions.ts` - Universal permission hook
3. `docs/PERMISSIONS_MATRIX.md` - Complete permission reference
4. `docs/PERMISSIONS_IMPLEMENTATION_SUMMARY.md` - This file

### Modified
1. `apps/web/src/lib/permissions/provider-capabilities.ts` - Updated to use new system
2. `apps/web/src/hooks/use-permissions.ts` - Added deprecation notice
3. `packages/api/src/lib/rbac.ts` - Added all role-specific permissions

## Usage Examples

### Frontend - Provider Dashboard
```typescript
import { usePermissions } from "@/hooks/use-permissions";

function MyComponent() {
  const { canManageHomes, canManageStaff } = usePermissions();
  
  return (
    <>
      {canManageHomes && <Button>Add Home</Button>}
      {canManageStaff && <Button>Invite Staff</Button>}
    </>
  );
}
```

### Frontend - Universal (All Roles)
```typescript
import { useRolePermissions } from "@/hooks/use-role-permissions";

function MyComponent() {
  const { 
    isCaseManager, 
    canCreateReferrals,
    canUseAISearch 
  } = useRolePermissions();
  
  if (isCaseManager && canCreateReferrals) {
    return <CreateReferralForm />;
  }
}
```

### Backend - Route Protection
```typescript
import { authMiddleware } from "../middleware/auth.middleware";
import { PROVIDER_PERMISSIONS } from "../lib/rbac";

router.post(
  "/providers/:providerId/homes",
  authMiddleware.requireAuth,
  authMiddleware.requirePermission(PROVIDER_PERMISSIONS.HOMES_MANAGE),
  homeController.createHome
);
```

## Verification Checklist

- ✅ All roles have capability definitions
- ✅ Frontend and backend capabilities are synchronized
- ✅ Permission hooks are available for all roles
- ✅ Backend middleware supports permission checking
- ✅ Documentation is complete
- ✅ Backward compatibility maintained
- ✅ Provider dashboard permissions already implemented
- ⚠️ Case Manager, Hospital SW, VRS, and Vendor dashboards need permission checks (future work)

## Next Steps

1. **Apply permissions to Case Manager dashboard** (when implemented)
   - Use `useRolePermissions()` hook
   - Check `CASE_MANAGER_CAPABILITIES`

2. **Apply permissions to Hospital SW dashboard** (when implemented)
   - Use `useRolePermissions()` hook
   - Check `HOSPITAL_SW_CAPABILITIES`

3. **Apply permissions to VRS dashboard** (when implemented)
   - Use `useRolePermissions()` hook
   - Check `VRS_CAPABILITIES`

4. **Apply permissions to Vendor dashboard** (when implemented)
   - Use `useRolePermissions()` hook
   - Check `VENDOR_CAPABILITIES`

5. **Add permission middleware to all API routes**
   - Review existing routes
   - Add `requirePermission()` where needed
   - Test permission enforcement

## Best Practices

1. **Always check permissions on both frontend and backend**
   - Frontend: Better UX (hide unavailable actions)
   - Backend: Security (mandatory enforcement)

2. **Use specific capabilities, not role checks**
   - ✅ `hasCapability(role, PROVIDER_CAPABILITIES.HOMES_MANAGE)`
   - ❌ `if (role === PROVIDER_OWNER)`

3. **Group related permissions**
   - Use `hasAnyCapability()` for OR logic
   - Use `hasAllCapabilities()` for AND logic

4. **Document permission requirements**
   - Add comments explaining why permissions are needed
   - Update PERMISSIONS_MATRIX.md when adding capabilities

## Testing

To verify permissions are working:

1. **Frontend Testing**
   - Test with different user roles
   - Verify UI elements are hidden/shown correctly
   - Check that `RequirePermission` guards work

2. **Backend Testing**
   - Test API routes with different roles
   - Verify 403 errors for unauthorized access
   - Check that permission middleware is applied

3. **Integration Testing**
   - Test complete workflows
   - Verify permissions are consistent across frontend/backend
   - Check edge cases (staff vs owner, etc.)

## References

- PRD: `docs/01-PRD-Product-Requirements.md`
- Schema: `packages/database/prisma/schema.prisma`
- Permissions Matrix: `docs/PERMISSIONS_MATRIX.md`
- Frontend Capabilities: `apps/web/src/lib/permissions/capabilities.ts`
- Backend RBAC: `packages/api/src/lib/rbac.ts`


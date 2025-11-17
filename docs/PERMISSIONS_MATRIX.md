# CareLinkMN Permissions Matrix

This document provides a comprehensive reference for all permissions and capabilities across all user roles in the CareLinkMN platform.

## Overview

The permission system is organized into role-specific capability sets:
- **Provider Capabilities**: For provider owners and staff
- **Case Manager Capabilities**: For case management organizations
- **Hospital Social Worker Capabilities**: For hospital discharge planning
- **VRS Capabilities**: For Vocational Rehabilitation Services
- **Vendor Capabilities**: For marketplace vendors
- **System Capabilities**: For administrators

## Permission Format

All permissions follow the pattern: `{role}:{resource}:{action}`

Examples:
- `provider:homes:manage` - Provider can manage homes
- `case_manager:referrals:create` - Case manager can create referrals
- `hospital_sw:discharge_cases:create` - Hospital SW can create discharge cases

## Role Capability Matrix

### Provider Owner (`PROVIDER_OWNER`)

**Full access to all provider capabilities:**

| Capability | Description |
|------------|-------------|
| `provider:dashboard:view` | View provider dashboard |
| `provider:profile:manage` | Manage provider profile and settings |
| `provider:homes:manage` | Create, update, delete homes |
| `provider:openings:manage` | Manage bed openings and availability |
| `provider:services:manage` | Manage services offered |
| `provider:placements:manage` | Manage resident placements |
| `provider:licenses:manage` | Manage licenses and credentials |
| `provider:residents:view` | View resident information |
| `provider:staff:manage` | Invite and manage staff members |
| `provider:billing:manage` | Manage subscription and billing |
| `provider:analytics:view` | View analytics and reports |
| `provider:referrals:view` | View incoming referrals |
| `provider:referrals:respond` | Respond to referrals |
| `provider:messages:manage` | Manage messages and communications |
| `provider:settings:manage` | Manage organization settings |

**Additional Permissions:**
- `providers:read` - Read provider information
- `providers:update` - Update provider information
- `providers:manage` - Full provider management
- `referrals:read` - Read referrals
- `referrals:update` - Update referrals
- `referrals:track` - Track referral status
- `analytics:own` - View own analytics
- `communications:send` - Send communications
- `notifications:send` - Send notifications

### Provider Staff (`PROVIDER_STAFF`)

**Day-to-day operations only (excludes billing, staff management, and settings):**

| Capability | Description |
|------------|-------------|
| `provider:dashboard:view` | View provider dashboard |
| `provider:profile:manage` | Manage basic profile information |
| `provider:homes:manage` | Manage homes |
| `provider:openings:manage` | Manage openings |
| `provider:services:manage` | Manage services |
| `provider:placements:manage` | Manage placements |
| `provider:licenses:manage` | Manage licenses |
| `provider:residents:view` | View residents |
| `provider:analytics:view` | View analytics |
| `provider:referrals:view` | View referrals |
| `provider:referrals:respond` | Respond to referrals |
| `provider:messages:manage` | Manage messages |

**Explicitly Excluded:**
- ❌ `provider:staff:manage` - Cannot manage staff
- ❌ `provider:billing:manage` - Cannot manage billing
- ❌ `provider:settings:manage` - Cannot manage settings

**Additional Permissions:**
- `providers:read` - Read provider information
- `referrals:read` - Read referrals
- `referrals:update` - Update referrals
- `referrals:track` - Track referrals
- `analytics:own` - View own analytics
- `communications:send` - Send communications
- `notifications:send` - Send notifications

### Case Manager (`CASE_MANAGER`)

**Referral and client management capabilities:**

| Capability | Description |
|------------|-------------|
| `case_manager:dashboard:view` | View case manager dashboard |
| `case_manager:referrals:create` | Create new referrals |
| `case_manager:referrals:view` | View referrals |
| `case_manager:referrals:update` | Update referrals |
| `case_manager:referrals:delete` | Delete referrals |
| `case_manager:referrals:assign` | Assign referrals |
| `case_manager:referrals:track` | Track referral status |
| `case_manager:search:view` | Search for providers |
| `case_manager:search:ai_assisted` | Use AI-assisted search (CareBot Pro) |
| `case_manager:shortlist:manage` | Manage provider shortlists |
| `case_manager:batch:outreach` | Send batch messages to providers |
| `case_manager:pipeline:view` | View referral pipeline |
| `case_manager:pipeline:kanban` | Use Kanban view for pipeline |
| `case_manager:export:data` | Export referral data |
| `case_manager:providers:view` | View provider profiles |
| `case_manager:messages:manage` | Manage messages |
| `case_manager:analytics:view` | View analytics |
| `case_manager:profile:manage` | Manage profile |

**Additional Permissions:**
- `providers:read` - Read provider information
- `referrals:create` - Create referrals (legacy)
- `referrals:read` - Read referrals (legacy)
- `referrals:update` - Update referrals (legacy)
- `referrals:assign` - Assign referrals (legacy)
- `referrals:track` - Track referrals (legacy)
- `analytics:own` - View own analytics
- `communications:send` - Send communications
- `notifications:send` - Send notifications

### Hospital Social Worker (`HOSPITAL_SW`)

**Discharge planning and coordination capabilities:**

| Capability | Description |
|------------|-------------|
| `hospital_sw:dashboard:view` | View hospital SW dashboard |
| `hospital_sw:discharge_cases:create` | Create discharge cases |
| `hospital_sw:discharge_cases:view` | View discharge cases |
| `hospital_sw:discharge_cases:update` | Update discharge cases |
| `hospital_sw:discharge_cases:delete` | Delete discharge cases |
| `hospital_sw:intake_forms:manage` | Manage intake forms |
| `hospital_sw:ai_matching:use` | Use AI-powered provider matching |
| `hospital_sw:provider_invitations:send` | Send provider invitations |
| `hospital_sw:provider_invitations:manage` | Manage invitations |
| `hospital_sw:nemt_booking:manage` | Manage NEMT bookings |
| `hospital_sw:checklists:manage` | Manage discharge checklists |
| `hospital_sw:providers:view` | View provider profiles |
| `hospital_sw:messages:manage` | Manage messages |
| `hospital_sw:analytics:view` | View analytics |
| `hospital_sw:profile:manage` | Manage profile |
| `hospital_sw:consent:manage` | Manage consent forms |

**Additional Permissions:**
- `providers:read` - Read provider information
- `referrals:create` - Create referrals (legacy)
- `referrals:read` - Read referrals (legacy)
- `referrals:update` - Update referrals (legacy)
- `referrals:assign` - Assign referrals (legacy)
- `referrals:track` - Track referrals (legacy)
- `analytics:own` - View own analytics
- `communications:send` - Send communications
- `notifications:send` - Send notifications

### VRS Specialist (`VRS_SPECIALIST`)

**Vocational rehabilitation capabilities:**

| Capability | Description |
|------------|-------------|
| `vrs:dashboard:view` | View VRS dashboard |
| `vrs:clients:create` | Create client records |
| `vrs:clients:view` | View client records |
| `vrs:clients:update` | Update client records |
| `vrs:clients:delete` | Delete client records |
| `vrs:job_matching:use` | Use job matching interface |
| `vrs:employers:view` | View employer listings |
| `vrs:employers:manage` | Manage employer relationships |
| `vrs:placements:create` | Create job placements |
| `vrs:placements:view` | View placements |
| `vrs:placements:update` | Update placements |
| `vrs:retention_analytics:view` | View retention analytics |
| `vrs:analytics:view` | View general analytics |
| `vrs:profile:manage` | Manage profile |

**Additional Permissions:**
- `providers:read` - Read provider information
- `referrals:create` - Create referrals (legacy)
- `referrals:read` - Read referrals (legacy)
- `referrals:update` - Update referrals (legacy)
- `referrals:assign` - Assign referrals (legacy)
- `referrals:track` - Track referrals (legacy)
- `analytics:own` - View own analytics
- `communications:send` - Send communications
- `notifications:send` - Send notifications

### Vendor (`VENDOR`)

**Marketplace vendor capabilities:**

| Capability | Description |
|------------|-------------|
| `vendor:dashboard:view` | View vendor dashboard |
| `vendor:profile:manage` | Manage vendor profile |
| `vendor:services:manage` | Manage services offered |
| `vendor:leads:view` | View leads |
| `vendor:leads:manage` | Manage leads |
| `vendor:bookings:view` | View bookings (NEMT) |
| `vendor:bookings:manage` | Manage bookings |
| `vendor:analytics:view` | View analytics |
| `vendor:sponsorship:manage` | Manage sponsorship/boost |

**Additional Permissions:**
- `providers:read` - Read provider information
- `referrals:read` - Read referrals
- `analytics:own` - View own analytics
- `communications:send` - Send communications
- `notifications:send` - Send notifications

### Super Admin (`SUPER_ADMIN`)

**Full system access - all capabilities from all roles plus system management:**

- All Provider Capabilities
- All Case Manager Capabilities
- All Hospital SW Capabilities
- All VRS Capabilities
- All Vendor Capabilities
- All System Capabilities (see below)

### Admin (`ADMIN`)

**Administrative access with most capabilities except system-level management:**

- All Provider Capabilities
- All Case Manager Capabilities
- All Hospital SW Capabilities
- All VRS Capabilities
- All Vendor Capabilities
- Limited System Capabilities:
  - `system:users:manage`
  - `system:organizations:manage`
  - `system:providers:approve`
  - `system:providers:verify`
  - `system:licenses:verify`
  - `system:audit:view`
  - `system:compliance:manage`

### Public (`PUBLIC`)

**No permissions - public users have no authenticated capabilities.**

## System Capabilities

These are only available to Super Admin and Admin roles:

| Capability | Description |
|------------|-------------|
| `system:manage` | Full system management |
| `system:view` | View system information |
| `system:users:manage` | Manage users |
| `system:organizations:manage` | Manage organizations |
| `system:providers:approve` | Approve provider registrations |
| `system:providers:verify` | Verify provider credentials |
| `system:licenses:verify` | Verify licenses |
| `system:audit:view` | View audit logs |
| `system:compliance:manage` | Manage compliance |

## Implementation Notes

### Frontend

- Use `usePermissions()` hook for provider-specific checks
- Use `useRolePermissions()` hook for universal role checks
- Capabilities are defined in `apps/web/src/lib/permissions/capabilities.ts`
- Provider capabilities are re-exported from `apps/web/src/lib/permissions/provider-capabilities.ts` for backward compatibility

### Backend

- Permissions are defined in `packages/api/src/lib/rbac.ts`
- Use `authMiddleware.requirePermission()` to protect routes
- Permission checks use the `hasPermission()` function from RBAC module

### Best Practices

1. **Always check permissions on both frontend and backend**
   - Frontend checks improve UX by hiding unavailable actions
   - Backend checks are mandatory for security

2. **Use specific capabilities rather than role checks**
   - `hasCapability(role, PROVIDER_CAPABILITIES.HOMES_MANAGE)` ✅
   - `if (role === PROVIDER_OWNER)` ❌ (too restrictive)

3. **Group related permissions**
   - Use `hasAnyCapability()` for OR logic
   - Use `hasAllCapabilities()` for AND logic

4. **Document permission requirements**
   - Add comments explaining why specific permissions are required
   - Update this matrix when adding new capabilities

## Migration Notes

- Legacy permissions (e.g., `referrals:create`) are maintained for backward compatibility
- New role-specific capabilities (e.g., `case_manager:referrals:create`) are preferred
- Both permission formats are checked in the backend for smooth migration

## References

- PRD: `docs/01-PRD-Product-Requirements.md`
- Schema: `packages/database/prisma/schema.prisma`
- Frontend Capabilities: `apps/web/src/lib/permissions/capabilities.ts`
- Backend RBAC: `packages/api/src/lib/rbac.ts`


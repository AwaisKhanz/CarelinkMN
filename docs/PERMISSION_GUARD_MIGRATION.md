# Permission Guard Migration Guide

## Overview

We've implemented a centralized `RequirePermission` guard component that prevents API calls when users lack required permissions. This ensures consistent access control across all provider dashboard pages.

## Component: `RequirePermission`

**Location:** `apps/web/src/components/auth/require-permission.tsx`

### Features

- ✅ Prevents children from rendering when access is denied (no API calls)
- ✅ Supports single permission, multiple permissions (any/all), or custom check functions
- ✅ Consistent `AccessRestricted` UI
- ✅ Customizable messages and actions

### Usage Patterns

#### Pattern 1: Single Permission
```tsx
export default function MyPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.HOMES_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage homes."
    >
      <MyPageContent />
    </RequirePermission>
  );
}
```

#### Pattern 2: Any of Multiple Permissions
```tsx
<RequirePermission
  anyPermission={[
    PROVIDER_CAPABILITIES.HOMES_MANAGE,
    PROVIDER_CAPABILITIES.SERVICES_MANAGE
  ]}
>
  <HomeServicesPageContent />
</RequirePermission>
```

#### Pattern 3: Custom Check Function
```tsx
<RequirePermission
  check={() => canManageHomes || canManageServices}
>
  <HomeServicesPageContent />
</RequirePermission>
```

## Migration Steps

For each page that needs permission protection:

1. **Extract page content** into a separate component (e.g., `MyPageContent`)
2. **Remove** the inline permission check and `AccessRestricted` return
3. **Remove** `usePermissions` import if only used for the guard
4. **Wrap** the default export with `RequirePermission`
5. **Import** `RequirePermission` and `PROVIDER_CAPABILITIES`

### Example Migration

**Before:**
```tsx
export default function ProviderHomesPage() {
  const { canManageHomes } = usePermissions();
  // ... hooks and state ...
  
  useEffect(() => {
    fetchHomes(); // API call happens even if no permission
  }, []);
  
  if (!canManageHomes) {
    return <AccessRestricted />;
  }
  
  return <div>...</div>;
}
```

**After:**
```tsx
function ProviderHomesPageContent() {
  // ... hooks and state ...
  // No permission check needed - guard handles it
  
  useEffect(() => {
    fetchHomes(); // Only runs if permission granted
  }, []);
  
  return <div>...</div>;
}

export default function ProviderHomesPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.HOMES_MANAGE}
      description="You don't have permission to manage homes."
    >
      <ProviderHomesPageContent />
    </RequirePermission>
  );
}
```

## Pages Migration Status

### ✅ Completed
- `homes/page.tsx` - Uses `HOMES_MANAGE`
- `services/page.tsx` - Uses `SERVICES_MANAGE`
- `licenses/create/page.tsx` - Uses `LICENSES_MANAGE`
- `staff/page.tsx` - Uses `STAFF_MANAGE`

### 🔄 Remaining Pages to Migrate

1. **Homes:**
   - `homes/create/page.tsx` - `HOMES_MANAGE`
   - `homes/[homeId]/edit/page.tsx` - `HOMES_MANAGE`
   - `homes/[homeId]/page.tsx` - `HOMES_MANAGE` (view only - may need different approach)
   - `homes/[homeId]/services/page.tsx` - `SERVICES_MANAGE` OR `HOMES_MANAGE`

2. **Openings:**
   - `openings/page.tsx` - `OPENINGS_MANAGE`
   - `openings/create/page.tsx` - `OPENINGS_MANAGE`
   - `openings/[openingId]/edit/page.tsx` - `OPENINGS_MANAGE`
   - `openings/[openingId]/page.tsx` - `OPENINGS_MANAGE` (view only)

3. **Licenses:**
   - `licenses/page.tsx` - View only (staff can view, owners can manage)
   - `licenses/[licenseId]/edit/page.tsx` - `LICENSES_MANAGE`

4. **Placements:**
   - `placements/page.tsx` - `PLACEMENTS_MANAGE`
   - `placements/create/page.tsx` - `PLACEMENTS_MANAGE`
   - `placements/[placementId]/page.tsx` - `PLACEMENTS_MANAGE` (view only)

5. **Other Pages:**
   - `dashboard/page.tsx` - `DASHBOARD_VIEW`
   - `analytics/page.tsx` - `ANALYTICS_VIEW`
   - `residents/page.tsx` - `RESIDENTS_VIEW`
   - `referrals/page.tsx` - `REFERRALS_VIEW` (view only, conditional actions)
   - `messages/page.tsx` - `MESSAGES_MANAGE`
   - `availability/page.tsx` - `HOMES_MANAGE`
   - `settings/page.tsx` - `SETTINGS_MANAGE` (already has redirect)

## Special Cases

### View-Only Pages with Conditional Actions

For pages where staff can view but not manage (e.g., Referrals, Licenses list):

1. **Don't wrap with RequirePermission** for view access
2. **Keep conditional rendering** of action buttons using `usePermissions`
3. **Ensure API calls** are safe for read-only access

Example:
```tsx
export default function LicensesPage() {
  const { canManageLicenses } = usePermissions();
  
  // Staff can view, owners can manage
  return (
    <div>
      {canManageLicenses && <Button>Add License</Button>}
      {/* License list - visible to all */}
    </div>
  );
}
```

## Benefits

1. **No API calls** when access is denied - children don't render
2. **Consistent UI** - All access denied pages look the same
3. **DRY principle** - No repeated permission check code
4. **Type safety** - Uses TypeScript for capability types
5. **Easy to maintain** - Single source of truth for permission logic


# Case Manager Dashboard - Shared Constants Implementation

**Date:** January 2025  
**Status:** ✅ Complete

## Overview

This document summarizes the implementation of shared constants and types for the Case Manager dashboard, following the same patterns as the Provider Dashboard.

## ✅ Completed Tasks

### 1. Shared Constants Created (`apps/web/src/lib/constants/index.ts`)

#### Referral & Case Manager Constants
- ✅ **URGENCY_CONFIG** - Urgency levels with icons and colors (URGENT, HIGH, ROUTINE)
- ✅ **REFERRAL_STATUS_CONFIG** - Referral statuses with colors (NEW, IN_REVIEW, TOURING, OFFER_MADE, PLACED, CLOSED, CANCELLED)
- ✅ **SHORTLIST_STATUS_CONFIG** - Shortlist statuses with colors (ADDED, CONTACTED, RESPONDED, TOURING, DECLINED)
- ✅ **PAYER_LABELS** - Payer type labels (moved from `opening.service.ts`)
- ✅ **PAYER_OPTIONS** - Payer options for forms (moved from `opening-form.tsx`)
- ✅ **GENDER_OPTIONS** - Gender options for forms (moved from `opening-form.tsx`)
- ✅ **CARE_LEVELS** - Care level options (moved from `opening-form.tsx`)
- ✅ **SUPPORTED_NEEDS** - Supported needs/services options (moved from `opening-form.tsx`)
- ✅ **BEHAVIORAL_NEEDS** - Behavioral needs options (new)
- ✅ **MEDICAL_NEEDS** - Medical needs options (new)
- ✅ **MOBILITY_LEVELS** - Mobility level options (new)

#### Helper Functions
- ✅ `getUrgencyLabel(urgency: Urgency): string`
- ✅ `getReferralStatusLabel(status: ReferralStatus): string`
- ✅ `getShortlistStatusLabel(status: ShortlistStatus): string`
- ✅ `getPayerLabel(payer: Payer): string`
- ✅ `getGenderLabel(gender: Gender): string`
- ✅ `getCareLevelLabel(level: string): string`
- ✅ `getSupportedNeedLabel(need: string): string`
- ✅ `getBehavioralNeedLabel(need: string): string`
- ✅ `getMedicalNeedLabel(need: string): string`
- ✅ `getMobilityLevelLabel(level: string): string`

### 2. Updated Files

#### Case Manager Dashboard
- ✅ `apps/web/src/app/case-manager/dashboard/page.tsx`
  - Now imports `URGENCY_CONFIG` from `@/lib/constants`
  - Uses shared constants for urgency badges
  - Removed unused imports

#### Provider Referrals Page
- ✅ `apps/web/src/app/provider/referrals/page.tsx`
  - Now imports `URGENCY_CONFIG`, `REFERRAL_STATUS_CONFIG`, `SHORTLIST_STATUS_CONFIG`, `PAYER_LABELS` from `@/lib/constants`
  - Removed local constant definitions
  - Fixed shortlist array handling (shortlist is an array, not a single object)
  - Updated statistics calculation to handle shortlist array

#### Opening Form
- ✅ `apps/web/src/components/forms/opening-form.tsx`
  - Now imports `CARE_LEVELS`, `SUPPORTED_NEEDS`, `PAYER_OPTIONS`, `GENDER_OPTIONS` from `@/lib/constants`
  - Removed local constant definitions
  - Kept `STATUS_OPTIONS` locally (for OpeningStatus, not ReferralStatus)

#### Opening Service
- ✅ `apps/web/src/lib/api/services/opening.service.ts`
  - Now imports `PAYER_LABELS` from `@/lib/constants`
  - Re-exports `PAYER_LABELS` for backward compatibility
  - Removed local `PAYER_LABELS` definition

## 📋 Constants Structure

### Urgency Configuration
```typescript
URGENCY_CONFIG: Record<Urgency, UrgencyConfig>
- URGENT: { label: "Urgent", color: "healthcareError", icon: AlertCircleIcon }
- HIGH: { label: "High", color: "healthcareWarning", icon: Clock }
- ROUTINE: { label: "Routine", color: "healthcareInfo", icon: Calendar }
```

### Referral Status Configuration
```typescript
REFERRAL_STATUS_CONFIG: Record<ReferralStatus, ReferralStatusConfig>
- NEW: { label: "New", color: "healthcareInfo" }
- IN_REVIEW: { label: "In Review", color: "healthcareWarning" }
- TOURING: { label: "Touring", color: "healthcareInfo" }
- OFFER_MADE: { label: "Offer Made", color: "healthcareSuccess" }
- PLACED: { label: "Placed", color: "healthcareSuccess" }
- CLOSED: { label: "Closed", color: "outline" }
- CANCELLED: { label: "Cancelled", color: "destructive" }
```

### Shortlist Status Configuration
```typescript
SHORTLIST_STATUS_CONFIG: Record<ShortlistStatus, ShortlistStatusConfig>
- ADDED: { label: "Added", color: "healthcareInfo" }
- CONTACTED: { label: "Contacted", color: "healthcareWarning" }
- RESPONDED: { label: "Responded", color: "healthcareSuccess" }
- TOURING: { label: "Touring", color: "healthcareInfo" }
- DECLINED: { label: "Declined", color: "destructive" }
```

### Payer Labels
```typescript
PAYER_LABELS: Record<Payer, string>
- MA: "Medical Assistance"
- MEDICARE: "Medicare"
- PRIVATE: "Private Pay"
- CADI: "CADI"
- BI_TBI: "BI/TBI"
- EW: "Elderly Waiver"
- DD: "Developmental Disabilities"
```

## 🎯 Benefits

1. **Consistency** - All constants are defined in one place
2. **Maintainability** - Easy to update constants across the entire application
3. **Type Safety** - All constants are properly typed
4. **Reusability** - Constants can be used across provider and case manager dashboards
5. **No Duplication** - Constants are not initialized in different page files

## 📝 Usage Examples

### Using Urgency Config
```typescript
import { URGENCY_CONFIG } from "@/lib/constants";

// In component
const config = URGENCY_CONFIG[referral.urgency];
const Icon = config.icon;

<Badge variant={config.color}>
  <Icon className="h-3 w-3 mr-1" />
  {config.label}
</Badge>
```

### Using Referral Status Config
```typescript
import { REFERRAL_STATUS_CONFIG } from "@/lib/constants";

// In component
const config = REFERRAL_STATUS_CONFIG[referral.status];

<Badge variant={config?.color || "outline"}>
  {config?.label || referral.status}
</Badge>
```

### Using Helper Functions
```typescript
import { getUrgencyLabel, getPayerLabel } from "@/lib/constants";

// In component
const urgencyLabel = getUrgencyLabel(referral.urgency);
const payerLabel = getPayerLabel(referral.primaryPayer);
```

## 🔍 Files Updated

1. ✅ `apps/web/src/lib/constants/index.ts` - Added all referral and case manager constants
2. ✅ `apps/web/src/app/case-manager/dashboard/page.tsx` - Updated to use shared constants
3. ✅ `apps/web/src/app/provider/referrals/page.tsx` - Updated to use shared constants
4. ✅ `apps/web/src/components/forms/opening-form.tsx` - Updated to use shared constants
5. ✅ `apps/web/src/lib/api/services/opening.service.ts` - Updated to import PAYER_LABELS from constants

## ✅ Verification

- ✅ All constants are properly typed
- ✅ All constants are exported from `@/lib/constants`
- ✅ No duplicate constant definitions
- ✅ All imports are updated
- ✅ No linter errors
- ✅ Type safety maintained

## 🚀 Next Steps

Now that all shared constants are properly implemented, we can proceed with:
1. **Step 3.3**: Referrals List Page
2. **Step 3.4**: Referral Detail Page
3. **Step 3.5**: Create/Edit Referral Page

All pages will use the shared constants from `@/lib/constants`, ensuring consistency across the entire Case Manager dashboard.

---

**Status:** ✅ Complete | **Ready for Step 3.3**


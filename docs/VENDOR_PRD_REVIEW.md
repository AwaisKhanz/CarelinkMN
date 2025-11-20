# Marketplace Vendors Dashboard - PRD & Schema Review

## PRD Requirements (Lines 151-163)

### Primary Needs:
1. **List services/products** - Vendors need to manage their service listings
2. **Receive qualified leads** - Vendors receive leads from marketplace inquiries
3. **Manage bookings (NEMT)** - Transport vendors manage NEMT bookings
4. **Track performance** - Analytics and metrics for vendor performance

### Key Features:
1. **Vendor profiles** - Manage vendor profile information
2. **Lead management** - View, manage, and track leads
3. **Booking queue (NEMT)** - Manage transport bookings queue
4. **Analytics access** - View performance metrics

## Schema Analysis

### Vendor Model (Schema Lines 1430-1471)
**Fields:**
- `id`, `organizationId`, `organization` (relation)
- `category` (VendorCategory enum)
- `subcategories` (String[])
- `businessName`, `description`, `logo`
- `services` (String[])
- `serviceAreas` (String[]) - Counties/Cities served
- `isSponsoredVendor`, `sponsorshipTier`, `sponsorshipExpiry`
- `averageRating`, `reviewCount`
- `isVerified`, `verifiedAt`
- `createdAt`, `updatedAt`
- Relations: `transportBookings[]`, `leads[]`

**VendorCategory Enum:**
- TRAINING
- DME (Durable Medical Equipment)
- HOME_MODS
- LEGAL
- STAFFING
- TRANSPORT (NEMT providers)

### TransportBooking Model (Schema Lines 1484-1523)
**Fields:**
- `id`, `dischargeCaseId` (unique), `dischargeCase` (relation)
- `vendorId`, `vendor` (relation)
- `pickupAddress`, `pickupTime`, `dropoffAddress`
- `vehicleType` (String: "AMBULANCE", "WHEELCHAIR_VAN", "SEDAN")
- `equipmentNeeded` (String[])
- `attendantRequired` (Boolean)
- `status` (BookingStatus enum)
- `estimatedCost`, `actualCost`, `payerType`
- `confirmationNumber`, `driverName`, `driverPhone`
- `createdAt`, `updatedAt`, `completedAt`

**BookingStatus Enum:**
- PENDING
- CONFIRMED
- IN_TRANSIT
- COMPLETED
- CANCELLED

### VendorLead Model (Schema Lines 1535-1562)
**Fields:**
- `id`, `vendorId`, `vendor` (relation)
- `name`, `email`, `phone`
- `servicesInterested` (String[])
- `message` (String?)
- `source` (String: "MARKETPLACE", "REFERRAL", "AD")
- `status` (LeadStatus enum)
- `createdAt`, `contactedAt`, `convertedAt`

**LeadStatus Enum:**
- NEW
- CONTACTED
- QUALIFIED
- CONVERTED
- LOST

## Current Implementation Status

### ✅ Existing:
- Basic vendor dashboard page (hardcoded data)
- Vendor onboarding page
- Basic backend routes (`GET /vendors/by-user/:userId`, `PUT /vendors/by-user/:userId`)
- Basic vendor service (get/update by userId)
- Vendor capabilities defined
- Sidebar navigation structure

### ❌ Missing:
1. **Frontend API Service** - No `vendorService` in `apps/web/src/lib/api/services/`
2. **Shared Types** - Vendor types not exported from `@carelink/types`
3. **Constants** - No vendor constants (categories, status configs, etc.)
4. **Utilities** - No vendor utility functions
5. **Backend API Endpoints**:
   - Get vendor profile (by vendor ID, not just userId)
   - Update vendor profile
   - Get leads (list with filters)
   - Update lead status
   - Get bookings (list with filters)
   - Update booking status
   - Get analytics
6. **Frontend Pages**:
   - Profile management page
   - Leads management page (list, detail, update status)
   - Bookings queue page (list, detail, update status)
   - Analytics page
   - Settings page
7. **Components**:
   - Vendor loading/error/empty states
   - Vendor detail header
   - Lead management components
   - Booking management components
   - Analytics components

## Implementation Plan

### Step 1: Shared Types & Enums
- Add `VendorCategory`, `BookingStatus`, `LeadStatus` to `@carelink/types`
- Add `Vendor`, `TransportBooking`, `VendorLead` interfaces
- Add request/response types for vendor operations

### Step 2: Constants
- Create `apps/web/src/lib/constants/vendor.ts`
- Vendor category labels and configs
- Booking status badge configs
- Lead status badge configs
- Vehicle types options
- Lead source options

### Step 3: Utilities
- Create `apps/web/src/lib/utils/vendor.ts`
- Badge config functions for statuses
- Display name helpers
- Format helpers

### Step 4: Backend Service
- Expand `packages/api/src/services/vendor.service.ts`
- Add methods: getVendorById, updateVendor, getLeads, updateLead, getBookings, updateBooking, getAnalytics

### Step 5: Backend Controller
- Expand `packages/api/src/controllers/vendor.controller.ts`
- Add all CRUD operations for vendor, leads, bookings
- Add analytics endpoint

### Step 6: Backend Routes
- Expand `packages/api/src/routes/vendor.routes.ts`
- Add routes: `/vendors/:vendorId`, `/vendors/:vendorId/leads`, `/vendors/:vendorId/bookings`, `/vendors/:vendorId/analytics`
- Add proper validation and RBAC

### Step 7: Frontend API Service
- Create `apps/web/src/lib/api/services/vendor.service.ts`
- Add all API methods matching backend

### Step 8: Shared Components
- Create `apps/web/src/components/vendor/` directory
- VendorLoadingState, VendorErrorState, VendorEmptyState, VendorDetailHeader

### Step 9: Dashboard Pages
- Refactor dashboard to use real data
- Create profile page
- Create leads page (list, detail)
- Create bookings page (list, detail)
- Create analytics page
- Create settings page

### Step 10: Layout & Navigation
- Create `apps/web/src/app/vendor/(dashboard)/layout.tsx`
- Update sidebar navigation to match PRD requirements
- Add page metadata hook

## PRD Compliance Checklist

### Primary Needs:
- [ ] List services/products - Need services management page
- [ ] Receive qualified leads - Need leads management page
- [ ] Manage bookings (NEMT) - Need bookings queue page
- [ ] Track performance - Need analytics page

### Key Features:
- [ ] Vendor profiles - Need profile management page
- [ ] Lead management - Need leads list/detail pages
- [ ] Booking queue (NEMT) - Need bookings list/detail pages
- [ ] Analytics access - Need analytics page

## Next Steps

1. Start with Step 1: Add shared types to `@carelink/types`
2. Continue with constants, utils, backend, then frontend
3. Build pages following the same pattern as VRS dashboard
4. Ensure 100% PRD compliance


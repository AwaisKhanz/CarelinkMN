# CareLinkMN Case Manager Portal - Comprehensive Implementation Plan

**Review Date:** January 2025  
**Status:** Planning Phase  
**Based On:** PRD v1.0.0 & Database Schema

---

## Executive Summary

This document provides a comprehensive plan for implementing the Case Manager Portal for CareLinkMN, following the same systematic approach used for the Provider Dashboard. The plan is 100% aligned with the PRD requirements and database schema.

**Target User:** Case Managers (CM)  
**Primary Needs:**
- Find appropriate placements quickly
- Manage multiple referrals
- Communicate with providers
- Track placement pipeline

**Key Features (from PRD):**
- AI-assisted search (CareBot Pro)
- Referral creation and management
- Batch outreach capabilities
- Pipeline Kanban view
- Export functionality

---

## 1. PRD Requirements Analysis

### Epic 3: Care Coordination

**US-020**: As a case manager, I want to create referrals with client needs so that I can find appropriate placements.
- **Acceptance Criteria**:
  - ✅ De-identified client profiles created
  - ✅ Payer information required
  - ✅ Shortlist functionality works
  - ✅ Batch messaging available

### Additional Requirements from PRD Section 3.3

**Referral Creation:**
- De-identified client profiles
- Payer requirement enforcement
- Provider shortlisting
- Batch outreach capabilities

**Messaging System:**
- Thread-based conversations
- Attachment support (signed URLs)
- Read receipts
- SLA tracking badges

**AI-Powered Search (CareBot):**
- Natural language to structured filters
- 90%+ accuracy on MN-specific vocabulary
- Rate limiting: 10 queries/min/user
- Graceful fallback to manual filters

---

## 2. Database Schema Analysis

### Relevant Models

#### CaseManager Model
```prisma
model CaseManager {
  id             String    @id @default(uuid())
  organizationId String
  organization   Organization @relation(...)
  firstName      String
  lastName       String
  email          String    @unique
  phone          String?
  licenseNumber  String?
  licenseExpiry  DateTime?
  isActive       Boolean   @default(true)
  referrals      Referral[]
}
```

#### Referral Model
```prisma
model Referral {
  id                String    @id @default(uuid())
  referralNumber    String    @unique @default(cuid())
  caseManagerId     String
  caseManager       User      @relation(...)
  caseManagerProfileId String?
  caseManagerProfile CaseManager? @relation(...)
  organizationId    String
  
  // Client (De-identified)
  clientAge         Int
  clientGender      Gender
  clientInitials    String
  
  // Needs
  careLevels        String[]
  servicesNeeded    String[]
  mobilityLevel     String?
  behavioralNeeds   String[]
  medicalNeeds      String[]
  
  // Preferences
  preferredCounties String[]
  preferredCities   String[]
  maxDistance       Int?
  
  // Payer
  primaryPayer      Payer
  secondaryPayer    Payer?
  
  // Timeline
  targetMoveDate    DateTime?
  urgency           Urgency   @default(ROUTINE)
  
  // Status
  status            ReferralStatus @default(NEW)
  
  // Relations
  shortlist         ReferralShortlist[]
  messages          MessageThread[]
  placements        Placement[]
}
```

#### ReferralShortlist Model
```prisma
model ReferralShortlist {
  id            String    @id @default(uuid())
  referralId    String
  referral      Referral  @relation(...)
  providerId    String
  
  status        ShortlistStatus @default(ADDED)
  addedAt       DateTime  @default(now())
  contactedAt   DateTime?
  respondedAt   DateTime?
  notes         String?
}
```

#### MessageThread Model
```prisma
model MessageThread {
  id                String    @id @default(uuid())
  referralId        String?
  referral          Referral? @relation(...)
  providerId        String
  provider          Provider  @relation(...)
  initiatorId       String
  
  status            ThreadStatus @default(OPEN)
  firstResponseAt   DateTime?
  avgResponseTime   Int?
  
  messages          Message[]
}
```

---

## 3. Current State Assessment

### ✅ What Exists
1. **Basic Structure:**
   - `/case-manager/dashboard` page (basic)
   - `/case-manager/onboarding` page
   - Sidebar navigation items defined
   - Route guards (CaseManagerGuard mentioned in docs)

2. **Backend:**
   - Referral model in schema
   - ReferralShortlist model
   - MessageThread model
   - User with CASE_MANAGER role

3. **Shared Infrastructure:**
   - Messaging system (used by providers)
   - Search functionality (public search exists)
   - Authentication/authorization system

### ❌ What's Missing
1. **Backend APIs:**
   - Case Manager service layer
   - Referral CRUD operations
   - Shortlist management
   - Batch messaging
   - Case Manager dashboard data aggregation

2. **Frontend Pages:**
   - Referral creation form
   - Referral list/management
   - Referral detail view
   - Shortlist management
   - Pipeline Kanban view
   - Batch operations UI
   - Provider search (case manager specific)
   - Settings page

3. **Features:**
   - AI-powered search (CareBot)
   - Batch outreach
   - Export functionality
   - Pipeline tracking

---

## 4. Implementation Plan - Step by Step

### Phase 1: Foundation & Types (Week 1)

#### Step 1.1: Shared Types & Interfaces
**Location:** `packages/types/src/case-manager.ts` or `@carelink/types`

**Types to Create:**
```typescript
// Referral Types
export interface Referral {
  id: string;
  referralNumber: string;
  caseManagerId: string;
  caseManagerProfileId?: string;
  organizationId: string;
  
  // Client (De-identified)
  clientAge: number;
  clientGender: Gender;
  clientInitials: string;
  
  // Needs
  careLevels: string[];
  servicesNeeded: string[];
  mobilityLevel?: string;
  behavioralNeeds: string[];
  medicalNeeds: string[];
  
  // Preferences
  preferredCounties: string[];
  preferredCities: string[];
  maxDistance?: number;
  
  // Payer
  primaryPayer: Payer;
  secondaryPayer?: Payer;
  
  // Timeline
  targetMoveDate?: string;
  urgency: Urgency;
  
  // Status
  status: ReferralStatus;
  internalNotes?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  placedAt?: string;
  closedAt?: string;
  
  // Relations
  caseManager?: User;
  caseManagerProfile?: CaseManager;
  shortlist?: ReferralShortlist[];
  messages?: MessageThread[];
  placements?: Placement[];
}

export interface CreateReferralData {
  // Client
  clientAge: number;
  clientGender: Gender;
  clientInitials: string;
  
  // Needs
  careLevels: string[];
  servicesNeeded: string[];
  mobilityLevel?: string;
  behavioralNeeds?: string[];
  medicalNeeds?: string[];
  
  // Preferences
  preferredCounties: string[];
  preferredCities?: string[];
  maxDistance?: number;
  
  // Payer
  primaryPayer: Payer;
  secondaryPayer?: Payer;
  
  // Timeline
  targetMoveDate?: string;
  urgency?: Urgency;
  
  // Notes
  internalNotes?: string;
  
  // Initial shortlist (optional)
  providerIds?: string[];
}

export interface UpdateReferralData {
  // All fields from CreateReferralData optional
  // Plus status updates
  status?: ReferralStatus;
}

export interface ReferralShortlist {
  id: string;
  referralId: string;
  providerId: string;
  status: ShortlistStatus;
  addedAt: string;
  contactedAt?: string;
  respondedAt?: string;
  notes?: string;
  
  // Relations
  referral?: Referral;
  provider?: Provider;
}

export interface AddToShortlistData {
  providerIds: string[];
  notes?: string;
}

export interface UpdateShortlistData {
  status?: ShortlistStatus;
  notes?: string;
}

// Case Manager Dashboard Types
export interface CaseManagerDashboard {
  stats: {
    totalReferrals: number;
    activeReferrals: number;
    pendingPlacements: number;
    completedPlacements: number;
    averagePlacementTime: number; // in days
    responseRate: number; // percentage
  };
  recentReferrals: Referral[];
  urgentReferrals: Referral[];
  recentPlacements: Placement[];
}

// Batch Operations Types
export interface BatchMessageData {
  referralIds: string[];
  providerIds: string[];
  message: string;
  attachments?: MessageAttachmentData[];
}

export interface BatchShortlistData {
  referralId: string;
  providerIds: string[];
  notes?: string;
}
```

#### Step 1.2: API Service Layer
**Location:** `packages/api/src/services/referral.service.ts`

**Methods to Implement:**
```typescript
export class ReferralService {
  // CRUD Operations
  async createReferral(userId: string, data: CreateReferralData): Promise<ApiResponse<Referral>>
  async getReferralById(referralId: string, userId: string): Promise<ApiResponse<Referral>>
  async getReferrals(userId: string, filters: GetReferralsParams): Promise<ApiResponse<PaginatedReferrals>>
  async updateReferral(referralId: string, userId: string, data: UpdateReferralData): Promise<ApiResponse<Referral>>
  async deleteReferral(referralId: string, userId: string): Promise<ApiResponse<void>>
  
  // Shortlist Management
  async addToShortlist(referralId: string, userId: string, data: AddToShortlistData): Promise<ApiResponse<ReferralShortlist[]>>
  async updateShortlistStatus(shortlistId: string, userId: string, data: UpdateShortlistData): Promise<ApiResponse<ReferralShortlist>>
  async removeFromShortlist(shortlistId: string, userId: string): Promise<ApiResponse<void>>
  async getShortlist(referralId: string, userId: string): Promise<ApiResponse<ReferralShortlist[]>>
  
  // Batch Operations
  async batchAddToShortlist(referralId: string, userId: string, providerIds: string[]): Promise<ApiResponse<ReferralShortlist[]>>
  async batchMessageProviders(data: BatchMessageData, userId: string): Promise<ApiResponse<MessageThread[]>>
  
  // Dashboard
  async getCaseManagerDashboard(userId: string): Promise<ApiResponse<CaseManagerDashboard>>
}
```

**Location:** `packages/api/src/services/case-manager.service.ts`

**Methods to Implement:**
```typescript
export class CaseManagerService {
  async getCaseManagerProfile(userId: string): Promise<ApiResponse<CaseManager>>
  async updateCaseManagerProfile(userId: string, data: UpdateCaseManagerData): Promise<ApiResponse<CaseManager>>
  async getCaseManagerStats(userId: string, dateRange?: DateRange): Promise<ApiResponse<CaseManagerStats>>
}
```

#### Step 1.3: API Controllers
**Location:** `packages/api/src/controllers/referral.controller.ts`

**Endpoints to Create:**
```typescript
// Referral CRUD
POST   /api/referrals
GET    /api/referrals
GET    /api/referrals/:id
PUT    /api/referrals/:id
DELETE /api/referrals/:id

// Shortlist Management
POST   /api/referrals/:id/shortlist
PUT    /api/referrals/:id/shortlist/:shortlistId
DELETE /api/referrals/:id/shortlist/:shortlistId
GET    /api/referrals/:id/shortlist

// Batch Operations
POST   /api/referrals/:id/shortlist/batch
POST   /api/referrals/batch-message

// Dashboard
GET    /api/case-managers/:id/dashboard
GET    /api/case-managers/:id/stats
```

#### Step 1.4: API Routes
**Location:** `packages/api/src/routes/referral.routes.ts`

**Route Definitions:**
```typescript
router.post('/referrals', authMiddleware, validate([...]), referralController.createReferral)
router.get('/referrals', authMiddleware, validate([...]), referralController.getReferrals)
router.get('/referrals/:id', authMiddleware, validate([...]), referralController.getReferralById)
router.put('/referrals/:id', authMiddleware, validate([...]), referralController.updateReferral)
router.delete('/referrals/:id', authMiddleware, validate([...]), referralController.deleteReferral)

// Shortlist
router.post('/referrals/:id/shortlist', authMiddleware, validate([...]), referralController.addToShortlist)
router.put('/referrals/:id/shortlist/:shortlistId', authMiddleware, validate([...]), referralController.updateShortlist)
router.delete('/referrals/:id/shortlist/:shortlistId', authMiddleware, validate([...]), referralController.removeFromShortlist)
router.get('/referrals/:id/shortlist', authMiddleware, validate([...]), referralController.getShortlist)

// Batch
router.post('/referrals/:id/shortlist/batch', authMiddleware, validate([...]), referralController.batchAddToShortlist)
router.post('/referrals/batch-message', authMiddleware, validate([...]), referralController.batchMessageProviders)

// Case Manager
router.get('/case-managers/:id/dashboard', authMiddleware, validate([...]), caseManagerController.getDashboard)
router.get('/case-managers/:id/stats', authMiddleware, validate([...]), caseManagerController.getStats)
```

---

### Phase 2: Frontend API Client (Week 1-2)

#### Step 2.1: Frontend API Service
**Location:** `apps/web/src/lib/api/services/referral.service.ts`

**Methods to Implement:**
```typescript
export class ReferralService {
  async createReferral(data: CreateReferralData): Promise<ApiResponse<Referral>>
  async getReferrals(params?: GetReferralsParams): Promise<ApiResponse<PaginatedReferrals>>
  async getReferralById(referralId: string): Promise<ApiResponse<Referral>>
  async updateReferral(referralId: string, data: UpdateReferralData): Promise<ApiResponse<Referral>>
  async deleteReferral(referralId: string): Promise<ApiResponse<void>>
  
  // Shortlist
  async addToShortlist(referralId: string, data: AddToShortlistData): Promise<ApiResponse<ReferralShortlist[]>>
  async updateShortlistStatus(shortlistId: string, data: UpdateShortlistData): Promise<ApiResponse<ReferralShortlist>>
  async removeFromShortlist(shortlistId: string): Promise<ApiResponse<void>>
  async getShortlist(referralId: string): Promise<ApiResponse<ReferralShortlist[]>>
  
  // Batch
  async batchAddToShortlist(referralId: string, providerIds: string[]): Promise<ApiResponse<ReferralShortlist[]>>
  async batchMessageProviders(data: BatchMessageData): Promise<ApiResponse<MessageThread[]>>
}
```

**Location:** `apps/web/src/lib/api/services/case-manager.service.ts`

```typescript
export class CaseManagerService {
  async getDashboard(): Promise<ApiResponse<CaseManagerDashboard>>
  async getStats(dateRange?: DateRange): Promise<ApiResponse<CaseManagerStats>>
  async getProfile(): Promise<ApiResponse<CaseManager>>
  async updateProfile(data: UpdateCaseManagerData): Promise<ApiResponse<CaseManager>>
}
```

#### Step 2.2: Export Types
**Location:** `apps/web/src/lib/api/index.ts`

```typescript
export { ReferralService, referralService } from './services/referral.service';
export { CaseManagerService, caseManagerService } from './services/case-manager.service';

export type {
  Referral,
  CreateReferralData,
  UpdateReferralData,
  ReferralShortlist,
  AddToShortlistData,
  UpdateShortlistData,
  CaseManagerDashboard,
  BatchMessageData,
  BatchShortlistData,
  GetReferralsParams,
  PaginatedReferrals,
} from './services/referral.service';

export type {
  CaseManager,
  CaseManagerStats,
  UpdateCaseManagerData,
} from './services/case-manager.service';
```

---

### Phase 3: Core Frontend Pages (Week 2-3)

#### Step 3.1: Layout & Navigation
**Location:** `apps/web/src/app/case-manager/layout.tsx`

**Features:**
- CaseManagerGuard
- CaseManagerContext (for caching case manager data)
- PageMetadataProvider
- DashboardLayout wrapper

**Navigation Items (from sidebar.tsx):**
- Dashboard
- My Cases (Referrals)
- Clients
- Search Providers
- Urgent Cases
- Settings

#### Step 3.2: Dashboard Page
**Location:** `apps/web/src/app/case-manager/dashboard/page.tsx`

**Features:**
- Stats cards:
  - Total Referrals
  - Active Referrals
  - Pending Placements
  - Completed Placements
  - Average Placement Time
  - Response Rate
- Recent Referrals list
- Urgent Referrals alert
- Recent Placements
- Quick actions:
  - Create New Referral
  - View All Referrals
  - Search Providers

#### Step 3.3: Referrals List Page
**Location:** `apps/web/src/app/case-manager/referrals/page.tsx`

**Features:**
- DataTable with columns:
  - Referral #
  - Client (Initials, Age, Gender)
  - Status
  - Urgency
  - Payer
  - Target Move Date
  - Shortlisted Providers
  - Actions
- Filters:
  - Status (NEW, IN_REVIEW, TOURING, OFFER_MADE, PLACED, CLOSED, CANCELLED)
  - Urgency (URGENT, HIGH, ROUTINE)
  - Payer
  - Date range
- Search by referral number, client initials
- Bulk operations:
  - Batch add to shortlist
  - Batch message providers
  - Export to CSV
- View modes:
  - Table view
  - Kanban view (Pipeline)

#### Step 3.4: Referral Detail Page
**Location:** `apps/web/src/app/case-manager/referrals/[referralId]/page.tsx`

**Features:**
- Referral information display
- Client needs summary
- Shortlist management:
  - Add providers to shortlist
  - View shortlisted providers
  - Update shortlist status
  - Remove from shortlist
- Messages section:
  - Thread list
  - Send message to providers
  - Batch message
- Placement tracking:
  - View placements from this referral
  - Create placement button
- Actions:
  - Edit referral
  - Update status
  - Close referral
  - Delete referral

#### Step 3.5: Create/Edit Referral Page
**Location:** `apps/web/src/app/case-manager/referrals/create/page.tsx`  
**Location:** `apps/web/src/app/case-manager/referrals/[referralId]/edit/page.tsx`

**Form Sections:**
1. **Client Information (De-identified)**
   - Client Initials (required)
   - Age (required)
   - Gender (required)

2. **Care Needs**
   - Care Levels (multi-select)
   - Services Needed (multi-select)
   - Mobility Level (select)
   - Behavioral Needs (multi-select)
   - Medical Needs (multi-select)

3. **Location Preferences**
   - Preferred Counties (multi-select)
   - Preferred Cities (multi-select, optional)
   - Max Distance (number, optional)

4. **Payer Information**
   - Primary Payer (required)
   - Secondary Payer (optional)

5. **Timeline**
   - Target Move Date (date picker, optional)
   - Urgency (select: URGENT, HIGH, ROUTINE)

6. **Notes**
   - Internal Notes (textarea, optional)

7. **Initial Shortlist (Optional)**
   - Provider search/select
   - Add multiple providers

**Validation:**
- Client initials: required, 2 characters
- Age: required, 18-120
- Gender: required
- Care levels: at least one required
- Services needed: at least one required
- Primary payer: required
- Urgency: defaults to ROUTINE

#### Step 3.6: Pipeline Kanban View
**Location:** `apps/web/src/app/case-manager/referrals/kanban/page.tsx` or as a view mode

**Features:**
- Kanban board with columns:
  - NEW
  - IN_REVIEW
  - TOURING
  - OFFER_MADE
  - PLACED
  - CLOSED
- Drag and drop between statuses
- Card shows:
  - Referral number
  - Client initials
  - Urgency badge
  - Payer
  - Shortlisted providers count
  - Target move date
- Click card to view detail

---

### Phase 4: Advanced Features (Week 3-4)

#### Step 4.1: Provider Search (Case Manager Specific)
**Location:** `apps/web/src/app/case-manager/search/page.tsx`

**Features:**
- Enhanced search with referral context
- Filters:
  - Location (County/City/ZIP + radius)
  - License types
  - Services (based on referral needs)
  - Payer acceptance
  - Availability
- Results show:
  - Provider name
  - Homes with availability
  - Matching services
  - Payer acceptance
  - Response time
  - "Add to Shortlist" button
- Batch select providers
- "Add Selected to Shortlist" button

#### Step 4.2: Batch Operations
**Location:** Integrated into referrals list and detail pages

**Features:**
- **Batch Add to Shortlist:**
  - Select multiple referrals
  - Select multiple providers
  - Add all combinations to shortlist
  - Optional notes

- **Batch Message:**
  - Select referrals
  - Select providers
  - Compose message
  - Attach files
  - Send to all selected

#### Step 4.3: Export Functionality
**Location:** `apps/web/src/app/case-manager/referrals/page.tsx`

**Features:**
- Export filtered referrals to CSV
- Include columns:
  - Referral #
  - Client Info
  - Status
  - Urgency
  - Payer
  - Target Move Date
  - Shortlisted Providers
  - Created Date
  - Updated Date

#### Step 4.4: Urgent Cases Page
**Location:** `apps/web/src/app/case-manager/urgent/page.tsx`

**Features:**
- Filter referrals by URGENT urgency
- Sort by target move date
- Highlight cases needing immediate attention
- Quick actions:
  - Add to shortlist
  - Send message
  - Update status

---

### Phase 5: Messaging Integration (Week 4)

#### Step 5.1: Messaging from Referrals
**Location:** Integrated into referral detail page

**Features:**
- View message threads for referral
- Send message to shortlisted providers
- Batch message all shortlisted providers
- Message templates
- Attachment support

---

### Phase 6: Settings & Profile (Week 4)

#### Step 6.1: Case Manager Settings
**Location:** `apps/web/src/app/case-manager/settings/page.tsx`

**Features:**
- Profile information
- Organization details
- Notification preferences
- Default referral settings
- Export preferences

---

## 5. Implementation Order (Recommended)

### Sprint 1: Foundation (Week 1)
1. ✅ Create shared types and interfaces
2. ✅ Implement backend service layer (ReferralService, CaseManagerService)
3. ✅ Implement backend controllers
4. ✅ Create API routes
5. ✅ Implement frontend API client

### Sprint 2: Core Pages (Week 2)
1. ✅ Case Manager layout and navigation
2. ✅ Dashboard page
3. ✅ Referrals list page (table view)
4. ✅ Referral detail page
5. ✅ Create referral page

### Sprint 3: Advanced Features (Week 3)
1. ✅ Edit referral page
2. ✅ Pipeline Kanban view
3. ✅ Provider search (case manager specific)
4. ✅ Shortlist management UI
5. ✅ Batch operations UI

### Sprint 4: Polish & Integration (Week 4)
1. ✅ Export functionality
2. ✅ Urgent cases page
3. ✅ Messaging integration
4. ✅ Settings page
5. ✅ Loading skeletons
6. ✅ Empty states
7. ✅ Error handling
8. ✅ Confirmation dialogs

---

## 6. Technical Considerations

### Authentication & Authorization
- Use existing auth middleware
- Verify user has CASE_MANAGER role
- Verify user has access to their organization's referrals
- Row-level security for referrals (users can only see their org's referrals)

### Data Validation
- Client initials: 2 characters, letters only
- Age: 18-120
- Care levels: from controlled vocabulary
- Services: from Service model
- Payers: from Payer enum
- Counties/Cities: validate against MN locations

### Performance
- Pagination for referrals list (20 per page)
- Lazy loading for shortlist providers
- Optimistic updates for status changes
- Caching for dashboard stats

### Error Handling
- Graceful error messages
- Retry logic for failed requests
- Validation error display
- Network error handling

---

## 7. Testing Checklist

### Backend
- [ ] Referral CRUD operations
- [ ] Shortlist management
- [ ] Batch operations
- [ ] Authorization checks
- [ ] Data validation
- [ ] Error handling

### Frontend
- [ ] All pages render correctly
- [ ] Forms validate properly
- [ ] API calls work
- [ ] Error states display
- [ ] Loading states display
- [ ] Empty states display
- [ ] Responsive design
- [ ] Accessibility (WCAG AA)

---

## 8. Success Criteria

### Functional
- ✅ Case managers can create referrals
- ✅ Case managers can manage shortlists
- ✅ Case managers can send batch messages
- ✅ Pipeline Kanban view works
- ✅ Export functionality works
- ✅ All PRD requirements met

### Performance
- ✅ Page load < 2s
- ✅ API response < 200ms (p95)
- ✅ Smooth drag-and-drop in Kanban

### Quality
- ✅ No linter errors
- ✅ TypeScript types correct
- ✅ Consistent UI/UX
- ✅ Proper error handling

---

## 9. Next Steps

1. **Review this plan** with stakeholders
2. **Start with Sprint 1** - Foundation
3. **Implement step by step** following the order
4. **Test each feature** before moving to next
5. **Iterate based on feedback**

---

**Plan Created By:** AI Assistant  
**Date:** January 2025  
**Status:** Ready for Implementation


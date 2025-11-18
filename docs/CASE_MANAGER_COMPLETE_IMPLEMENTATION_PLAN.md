# Case Manager Complete Implementation Plan

**Review Date:** January 2025  
**Status:** Comprehensive Gap Analysis & Implementation Plan  
**Based On:** PRD v1.0.0 & Database Schema v1.0.0

---

## Executive Summary

This document provides a complete analysis of the Case Manager implementation, comparing what exists against PRD requirements and database schema. It identifies all gaps and provides a step-by-step plan to complete the implementation.

**Target User:** Case Managers (CM)  
**Primary Needs (from PRD Section 3.3):**
- Find appropriate placements quickly
- Manage multiple referrals
- Communicate with providers
- Track placement pipeline

**Key Features Required (from PRD Section 3.3):**
- ✅ AI-assisted search (CareBot Pro)
- ✅ Referral creation and management
- ✅ Batch outreach capabilities
- ✅ Pipeline Kanban view
- ✅ Export functionality

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
- ✅ De-identified client profiles
- ✅ Payer requirement enforcement
- ✅ Provider shortlisting
- ✅ Batch outreach capabilities

**Messaging System:**
- ✅ Thread-based conversations
- ✅ Attachment support (signed URLs)
- ✅ Read receipts
- ⚠️ SLA tracking badges (needs verification)

**AI-Powered Search (CareBot):**
- ✅ Natural language to structured filters
- ⚠️ 90%+ accuracy on MN-specific vocabulary (basic implementation exists, needs OpenAI integration)
- ⚠️ Rate limiting: 10 queries/min/user (basic implementation exists)
- ✅ Graceful fallback to manual filters

---

## 2. Current State Assessment

### ✅ What Exists (Well Implemented)

#### Frontend Pages
1. **Dashboard** (`/case-manager/dashboard`)
   - ✅ Stats cards (Total, Active, Pending, Completed)
   - ✅ Urgent referrals list
   - ✅ Recent referrals list
   - ✅ Recent placements
   - ✅ Quick actions
   - ✅ Permission checks (`RequirePermission`)

2. **Referrals List** (`/case-manager/referrals`)
   - ✅ DataTable with all columns
   - ✅ Filters (Status, Urgency, Payer, Search)
   - ✅ Pagination
   - ✅ Table and Kanban view modes
   - ✅ Bulk operations (Add to Shortlist, Batch Message)
   - ✅ Export to CSV functionality
   - ✅ Permission checks

3. **Referral Detail** (`/case-manager/referrals/[referralId]`)
   - ✅ Complete referral information display
   - ✅ Tabs: Overview, Shortlist, Messages, Placements, Timeline
   - ✅ Status update
   - ✅ Delete referral
   - ✅ Batch messaging
   - ✅ Permission checks

4. **Create Referral** (`/case-manager/referrals/create`)
   - ✅ Complete form with all fields
   - ✅ Validation
   - ✅ Default settings integration

5. **Edit Referral** (`/case-manager/referrals/[referralId]/edit`)
   - ✅ Edit form
   - ✅ Validation

6. **Search Providers** (`/case-manager/search`)
   - ✅ Advanced filters
   - ✅ AI search (CareBot) integration
   - ✅ Provider results with availability
   - ✅ Add to shortlist functionality
   - ✅ Permission checks

7. **Urgent Cases** (`/case-manager/urgent`)
   - ✅ Filtered view for urgent/high priority
   - ✅ Stats
   - ✅ Quick actions
   - ✅ Permission checks

8. **Clients** (`/case-manager/clients`)
   - ✅ Client aggregation from referrals
   - ✅ Search functionality
   - ✅ Client cards with referral info
   - ✅ Permission checks

9. **Messages** (`/case-manager/messages`)
   - ✅ Message threads
   - ✅ Permission checks

10. **Settings** (`/case-manager/settings`)
    - ✅ Profile management
    - ✅ Notification preferences
    - ✅ Default referral settings
    - ✅ License management
    - ✅ Permission checks

11. **Onboarding** (`/case-manager/onboarding`)
    - ✅ Organization setup
    - ✅ License upload
    - ✅ Review and submit

#### Backend Services
1. **CaseManagerService** (`packages/api/src/services/case-manager.service.ts`)
   - ✅ `getCaseManagerByUserId`
   - ✅ `updateCaseManager`
   - ✅ `getCaseManagerDashboard`
   - ✅ `getCaseManagerStats`

2. **ReferralService** (`packages/api/src/services/referral.service.ts`)
   - ✅ `createReferral`
   - ✅ `getReferralById`
   - ✅ `getReferrals`
   - ✅ `updateReferral`
   - ✅ `deleteReferral`
   - ✅ `addToShortlist`
   - ✅ `updateShortlistStatus`
   - ✅ `removeFromShortlist`
   - ✅ `getShortlist`
   - ✅ `batchAddToShortlist`
   - ✅ `batchMessageProviders`
   - ✅ `getCaseManagerDashboard`

3. **AISearchService** (`packages/api/src/services/ai-search.service.ts`)
   - ✅ `parseQuery` (basic implementation)
   - ✅ `checkRateLimit` (basic implementation)
   - ✅ `trackSearch`

#### Backend Routes
1. **Case Manager Routes** (`packages/api/src/routes/case-manager.routes.ts`)
   - ✅ `GET /case-managers/:userId` (with permission check)
   - ✅ `PUT /case-managers/:userId` (with permission check)
   - ✅ `GET /case-managers/:userId/dashboard` (with permission check)
   - ✅ `GET /case-managers/:userId/stats` (with permission check)

2. **Referral Routes** (`packages/api/src/routes/referral.routes.ts`)
   - ✅ All CRUD operations with permission checks
   - ✅ Shortlist management with permission checks
   - ✅ Batch operations with permission checks

3. **AI Search Routes** (`packages/api/src/routes/ai-search.routes.ts`)
   - ✅ `POST /ai-search/parse` (with permission check)

#### Shared Types
- ✅ `Referral` interface
- ✅ `CreateReferralData` interface
- ✅ `UpdateReferralData` interface
- ✅ `ReferralShortlist` interface
- ✅ `CaseManager` interface
- ✅ `CaseManagerDashboard` interface
- ✅ `CaseManagerStats` interface

#### Permissions
- ✅ All capabilities defined in `capabilities.ts`
- ✅ Permission checks on all routes
- ✅ Permission checks on all frontend pages
- ✅ `RequirePermission` guard component used

---

## 3. Gap Analysis - What's Missing or Incomplete

### 🔴 Critical Missing Features

#### 3.1 AI Search Enhancement (CareBot Pro)
**Status:** Basic implementation exists, needs OpenAI integration

**Current State:**
- Basic keyword matching for counties, cities, license types, payers
- No actual NLP/AI processing
- No 90%+ accuracy guarantee

**Required (from PRD):**
- Natural language to structured filters with 90%+ accuracy
- MN-specific vocabulary understanding
- OpenAI API integration
- Query explanation ("Why this match")

**Files to Update:**
- `packages/api/src/services/ai-search.service.ts` - Add OpenAI integration
- `apps/web/src/app/case-manager/(dashboard)/search/page.tsx` - Add query explanation UI

**Implementation Steps:**
1. Integrate OpenAI API for NLP
2. Create prompt engineering for MN care vocabulary
3. Add query explanation feature
4. Improve accuracy tracking
5. Add fallback handling

#### 3.2 Referral Assignment Feature
**Status:** Not implemented

**PRD Requirement:**
- `REFERRALS_ASSIGN` capability exists but no UI/backend support
- Case managers should be able to assign referrals to other case managers in their organization

**Required:**
- Backend: Assignment logic in `ReferralService`
- Backend: Route for assignment
- Frontend: Assignment UI in referral detail page
- Frontend: Assignment dropdown/selector

**Files to Create/Update:**
- `packages/api/src/services/referral.service.ts` - Add `assignReferral` method
- `packages/api/src/routes/referral.routes.ts` - Add assignment route
- `apps/web/src/app/case-manager/(dashboard)/referrals/[referralId]/components/` - Add assignment component

#### 3.3 Referral Tracking/Analytics
**Status:** Basic stats exist, detailed tracking missing

**PRD Requirement:**
- `REFERRALS_TRACK` capability exists
- Need detailed tracking of referral lifecycle
- Need analytics on placement success rates

**Required:**
- Enhanced analytics dashboard
- Referral timeline with detailed events
- Placement success rate tracking
- Provider response time tracking

**Files to Create/Update:**
- `packages/api/src/services/referral.service.ts` - Add tracking methods
- `apps/web/src/app/case-manager/(dashboard)/analytics/page.tsx` - Create analytics page (if missing)
- `apps/web/src/app/case-manager/(dashboard)/referrals/[referralId]/components/timeline-card.tsx` - Enhance timeline

#### 3.4 Pipeline View Enhancements
**Status:** Kanban exists, but needs drag-and-drop status updates

**Current State:**
- Kanban view exists
- Drag and drop UI exists
- Status update on drag may not be fully working

**Required:**
- Verify drag-and-drop updates referral status
- Add confirmation dialog for status changes
- Add undo functionality
- Add bulk status updates

**Files to Verify/Update:**
- `apps/web/src/app/case-manager/(dashboard)/referrals/components/referrals-kanban.tsx`
- `apps/web/src/app/case-manager/(dashboard)/referrals/page.tsx` - Verify `onStatusChange` handler

### 🟡 Partially Implemented Features

#### 3.5 Export Functionality
**Status:** CSV export exists, but may need enhancements

**Current State:**
- CSV export implemented in referrals page
- Exports filtered referrals

**Potential Enhancements:**
- Export with more detailed columns
- Export placements separately
- Export shortlist data
- PDF export option
- Scheduled exports

**Files to Review:**
- `apps/web/src/app/case-manager/(dashboard)/referrals/page.tsx` - `handleExportCSV` function

#### 3.6 Batch Operations
**Status:** Basic batch operations exist

**Current State:**
- Batch add to shortlist
- Batch message providers

**Potential Enhancements:**
- Batch status updates
- Batch assignment
- Batch export
- Template-based batch messaging

**Files to Review:**
- `apps/web/src/app/case-manager/(dashboard)/referrals/components/batch-add-to-shortlist-dialog.tsx`
- `apps/web/src/app/case-manager/(dashboard)/referrals/components/batch-message-dialog-list.tsx`

### 🟢 Minor Enhancements Needed

#### 3.7 Analytics Page
**Status:** Dashboard has basic stats, but no dedicated analytics page

**PRD Requirement:**
- `ANALYTICS_VIEW` capability exists
- Need comprehensive analytics dashboard

**Required:**
- Create dedicated analytics page
- Charts and graphs
- Date range filtering
- Export analytics data

**Files to Create:**
- `apps/web/src/app/case-manager/(dashboard)/analytics/page.tsx` (if missing)

#### 3.8 Message Templates
**Status:** Not implemented

**PRD Requirement:**
- Batch messaging exists
- Need message templates for common scenarios

**Required:**
- Template management UI
- Template selection in batch messaging
- Template variables (referral number, client initials, etc.)

**Files to Create:**
- `apps/web/src/app/case-manager/(dashboard)/settings/message-templates/page.tsx`
- `packages/api/src/services/messaging.service.ts` - Add template methods
- `packages/api/src/routes/messaging.routes.ts` - Add template routes

#### 3.9 Provider Viewing
**Status:** Search exists, but no dedicated provider viewing page

**PRD Requirement:**
- `PROVIDERS_VIEW` capability exists
- Case managers should be able to view provider profiles

**Required:**
- Provider profile view page for case managers
- Provider history/performance metrics
- Provider response rate tracking

**Files to Create:**
- `apps/web/src/app/case-manager/(dashboard)/providers/[providerId]/page.tsx`

---

## 4. Implementation Plan - Step by Step

### Phase 1: Critical Missing Features (Priority 1)

#### Step 1.1: Enhance AI Search with OpenAI Integration
**Estimated Time:** 2-3 days

**Tasks:**
1. Set up OpenAI API integration
2. Create prompt template for MN care vocabulary
3. Implement query parsing with OpenAI
4. Add query explanation feature
5. Improve accuracy tracking
6. Add error handling and fallback

**Files to Update:**
- `packages/api/src/services/ai-search.service.ts`
- `apps/web/src/app/case-manager/(dashboard)/search/page.tsx`
- Add environment variable for OpenAI API key

**Acceptance Criteria:**
- Natural language queries parse correctly
- 90%+ accuracy on test queries
- Query explanation shows why filters were applied
- Graceful fallback to manual filters on error

#### Step 1.2: Implement Referral Assignment
**Estimated Time:** 1-2 days

**Tasks:**
1. Add `assignReferral` method to `ReferralService`
2. Add assignment route with permission check
3. Create assignment UI component
4. Add assignment dropdown to referral detail page
5. Add assignment history to timeline

**Files to Create/Update:**
- `packages/api/src/services/referral.service.ts` - Add `assignReferral`
- `packages/api/src/routes/referral.routes.ts` - Add `POST /referrals/:id/assign`
- `apps/web/src/app/case-manager/(dashboard)/referrals/[referralId]/components/assignment-dialog.tsx` - New
- `apps/web/src/app/case-manager/(dashboard)/referrals/[referralId]/page.tsx` - Add assignment button

**Acceptance Criteria:**
- Case managers can assign referrals to other case managers in their organization
- Assignment is tracked in timeline
- Permission check: `REFERRALS_ASSIGN`
- Notification sent to assigned case manager

#### Step 1.3: Enhance Referral Tracking
**Estimated Time:** 2 days

**Tasks:**
1. Add detailed event tracking to referral lifecycle
2. Enhance timeline with all events
3. Add tracking analytics
4. Add provider response time tracking

**Files to Update:**
- `packages/api/src/services/referral.service.ts` - Add tracking methods
- `apps/web/src/app/case-manager/(dashboard)/referrals/[referralId]/components/timeline-card.tsx` - Enhance
- `packages/database/prisma/schema.prisma` - Verify audit logging

**Acceptance Criteria:**
- All referral events are tracked
- Timeline shows complete history
- Analytics show placement success rates
- Provider response times are tracked

#### Step 1.4: Verify and Fix Pipeline Kanban Drag-and-Drop
**Estimated Time:** 1 day

**Tasks:**
1. Test drag-and-drop functionality
2. Verify status updates on drop
3. Add confirmation dialog
4. Add error handling
5. Add undo functionality (optional)

**Files to Verify/Update:**
- `apps/web/src/app/case-manager/(dashboard)/referrals/components/referrals-kanban.tsx`
- `apps/web/src/app/case-manager/(dashboard)/referrals/page.tsx` - Verify `onStatusChange`

**Acceptance Criteria:**
- Drag-and-drop updates referral status
- Confirmation dialog appears for status changes
- Error handling for failed updates
- UI updates immediately on success

### Phase 2: Analytics and Reporting (Priority 2)

#### Step 2.1: Create Dedicated Analytics Page
**Estimated Time:** 2-3 days

**Tasks:**
1. Create analytics page component
2. Add charts and graphs (using recharts or similar)
3. Add date range filtering
4. Add export functionality
5. Add permission check

**Files to Create:**
- `apps/web/src/app/case-manager/(dashboard)/analytics/page.tsx`
- `apps/web/src/app/case-manager/(dashboard)/analytics/components/` - Chart components

**Files to Update:**
- `apps/web/src/components/layout/sidebar.tsx` - Add Analytics link (if missing)
- `packages/api/src/services/case-manager.service.ts` - Enhance stats method

**Acceptance Criteria:**
- Analytics page shows comprehensive metrics
- Charts are interactive
- Date range filtering works
- Export functionality works
- Permission check: `ANALYTICS_VIEW`

### Phase 3: Enhanced Features (Priority 3)

#### Step 3.1: Message Templates
**Estimated Time:** 2 days

**Tasks:**
1. Create message template model (if not in schema)
2. Add template CRUD operations
3. Create template management UI
4. Integrate templates into batch messaging
5. Add template variables

**Files to Create:**
- `apps/web/src/app/case-manager/(dashboard)/settings/message-templates/page.tsx`
- `packages/api/src/services/message-template.service.ts` (if needed)
- `packages/api/src/routes/message-template.routes.ts` (if needed)

**Files to Update:**
- `apps/web/src/app/case-manager/(dashboard)/referrals/components/batch-message-dialog-list.tsx` - Add template selector
- `packages/database/prisma/schema.prisma` - Add MessageTemplate model (if needed)

**Acceptance Criteria:**
- Case managers can create/edit/delete message templates
- Templates can be used in batch messaging
- Template variables are replaced correctly

#### Step 3.2: Provider Profile View for Case Managers
**Estimated Time:** 1-2 days

**Tasks:**
1. Create provider profile view page
2. Show provider performance metrics
3. Show response rate and history
4. Add "Add to Shortlist" button

**Files to Create:**
- `apps/web/src/app/case-manager/(dashboard)/providers/[providerId]/page.tsx`

**Files to Update:**
- `apps/web/src/components/layout/sidebar.tsx` - Add Providers link (if needed)
- `packages/api/src/routes/provider.routes.ts` - Verify public profile route

**Acceptance Criteria:**
- Case managers can view provider profiles
- Performance metrics are displayed
- Can add provider to shortlist from profile
- Permission check: `PROVIDERS_VIEW`

#### Step 3.3: Enhanced Export Functionality
**Estimated Time:** 1 day

**Tasks:**
1. Add more export columns
2. Add PDF export option
3. Add export templates
4. Add scheduled exports (optional)

**Files to Update:**
- `apps/web/src/app/case-manager/(dashboard)/referrals/page.tsx` - Enhance `handleExportCSV`
- Add PDF generation library (if needed)

**Acceptance Criteria:**
- Export includes all relevant data
- PDF export works
- Export templates can be customized

### Phase 4: Polish and Optimization (Priority 4)

#### Step 4.1: Performance Optimization
**Estimated Time:** 1-2 days

**Tasks:**
1. Optimize referral list loading
2. Add pagination improvements
3. Add caching where appropriate
4. Optimize dashboard data fetching

**Files to Review:**
- All case manager pages for performance issues
- API services for optimization opportunities

#### Step 4.2: Error Handling and Edge Cases
**Estimated Time:** 1 day

**Tasks:**
1. Review all error handling
2. Add proper error messages
3. Handle edge cases (empty states, network errors, etc.)
4. Add retry mechanisms

**Files to Review:**
- All case manager components
- All API services

#### Step 4.3: Accessibility and UX Improvements
**Estimated Time:** 1 day

**Tasks:**
1. Review accessibility (WCAG compliance)
2. Improve keyboard navigation
3. Add loading states
4. Improve empty states
5. Add helpful tooltips

**Files to Review:**
- All case manager pages
- All components

---

## 5. Database Schema Verification

### ✅ Verified Models (All Present)
- `CaseManager` - ✅ Complete
- `Referral` - ✅ Complete
- `ReferralShortlist` - ✅ Complete
- `MessageThread` - ✅ Complete
- `Message` - ✅ Complete
- `Placement` - ✅ Complete

### ⚠️ Potential Schema Additions

#### MessageTemplate Model (Optional)
If message templates are needed:
```prisma
model MessageTemplate {
  id            String    @id @default(uuid())
  caseManagerId String
  caseManager   CaseManager @relation(...)
  name          String
  subject       String?
  content       String    @db.Text
  variables     String[]  // Available variables
  isDefault     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

#### ReferralAssignment Model (If tracking assignments)
Currently assignments might be tracked via status/notes. If detailed tracking needed:
```prisma
model ReferralAssignment {
  id            String    @id @default(uuid())
  referralId    String
  referral      Referral  @relation(...)
  assignedBy    String    // User ID
  assignedTo    String    // User ID
  assignedAt    DateTime  @default(now())
  notes         String?
}
```

---

## 6. Permission Verification

### ✅ All Permissions Defined
All case manager capabilities are defined in:
- `apps/web/src/lib/permissions/capabilities.ts`
- `packages/api/src/lib/rbac.ts`

### ✅ Permission Checks Verified
- All routes have permission checks
- All frontend pages use `RequirePermission` guard
- UI elements are conditionally rendered based on permissions

### ⚠️ Potential Permission Gaps

1. **Referral Assignment** - `REFERRALS_ASSIGN` exists but feature not implemented
2. **Analytics** - `ANALYTICS_VIEW` exists but dedicated page may be missing
3. **Provider Viewing** - `PROVIDERS_VIEW` exists but dedicated page may be missing

---

## 7. Testing Checklist

### Unit Tests Needed
- [ ] ReferralService methods
- [ ] CaseManagerService methods
- [ ] AISearchService (with OpenAI mock)
- [ ] Permission checks

### Integration Tests Needed
- [ ] Referral CRUD operations
- [ ] Shortlist management
- [ ] Batch operations
- [ ] Message sending
- [ ] Export functionality

### E2E Tests Needed
- [ ] Create referral flow
- [ ] Search and add to shortlist
- [ ] Batch messaging
- [ ] Status updates via Kanban
- [ ] Export functionality

---

## 8. Implementation Priority Order

### Week 1: Critical Features
1. ✅ Verify AI Search works correctly
2. ✅ Implement Referral Assignment
3. ✅ Enhance Referral Tracking
4. ✅ Fix Pipeline Kanban drag-and-drop

### Week 2: Analytics and Reporting
1. ✅ Create Analytics Page
2. ✅ Enhance Export Functionality
3. ✅ Add Provider Profile View

### Week 3: Enhanced Features
1. ✅ Message Templates
2. ✅ Performance Optimization
3. ✅ Error Handling Improvements

### Week 4: Polish
1. ✅ Accessibility Improvements
2. ✅ UX Enhancements
3. ✅ Testing
4. ✅ Documentation

---

## 9. Files Requiring Immediate Attention

### High Priority
1. `packages/api/src/services/ai-search.service.ts` - Add OpenAI integration
2. `packages/api/src/services/referral.service.ts` - Add assignment method
3. `apps/web/src/app/case-manager/(dashboard)/referrals/components/referrals-kanban.tsx` - Verify drag-and-drop
4. `apps/web/src/app/case-manager/(dashboard)/analytics/page.tsx` - Create if missing

### Medium Priority
1. `apps/web/src/app/case-manager/(dashboard)/referrals/[referralId]/components/assignment-dialog.tsx` - Create
2. `apps/web/src/app/case-manager/(dashboard)/providers/[providerId]/page.tsx` - Create
3. `apps/web/src/app/case-manager/(dashboard)/settings/message-templates/page.tsx` - Create

### Low Priority
1. All pages - Performance optimization
2. All components - Accessibility improvements
3. All services - Error handling enhancements

---

## 10. Success Criteria

### Functional Requirements
- ✅ All PRD features implemented
- ✅ All permission checks in place
- ✅ All routes protected
- ✅ All UI elements conditionally rendered

### Quality Requirements
- ✅ 90%+ AI search accuracy
- ✅ Sub-1 second search response time
- ✅ Proper error handling
- ✅ WCAG 2.1 AA compliance
- ✅ Comprehensive testing

### User Experience
- ✅ Intuitive navigation
- ✅ Clear error messages
- ✅ Helpful empty states
- ✅ Loading indicators
- ✅ Success feedback

---

## 11. Next Steps

1. **Review this plan** with the team
2. **Prioritize features** based on business needs
3. **Start with Phase 1** (Critical Missing Features)
4. **Test thoroughly** after each phase
5. **Document** any deviations from plan

---

## 12. Notes

- Most core features are already implemented
- Main gaps are in AI search enhancement and assignment feature
- Analytics page may need to be created
- Overall implementation is ~85% complete
- Focus should be on polish and missing critical features


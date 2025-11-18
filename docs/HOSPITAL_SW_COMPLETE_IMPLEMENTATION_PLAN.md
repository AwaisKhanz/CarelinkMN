# Hospital Social Worker Dashboard - Complete Implementation Plan

## Overview

This document outlines the complete implementation plan for the Hospital Social Worker (HOSPITAL_SW) dashboard, following the same patterns and consistency established in the Provider and Case Manager dashboards.

## Goals

1. **Consistency**: Follow the same architectural patterns as Provider and Case Manager dashboards
2. **Reusability**: Leverage shared types, constants, utilities, and components
3. **Permissions**: Implement comprehensive permission checks throughout
4. **User Experience**: Provide intuitive discharge case management workflow
5. **Compliance**: Ensure PHI protection and audit logging

---

## Phase 1: Foundation & Shared Resources

### 1.1 Shared Types (`packages/types/src/index.ts`)

**Discharge Case Types:**
```typescript
// Discharge Status Enum (already in schema)
export enum DischargeStatus {
  INTAKE = "INTAKE",
  MATCHING = "MATCHING",
  INVITES_SENT = "INVITES_SENT",
  RESPONSES_PENDING = "RESPONSES_PENDING",
  PLACEMENT_CONFIRMED = "PLACEMENT_CONFIRMED",
  DISCHARGED = "DISCHARGED",
  FOLLOW_UP = "FOLLOW_UP",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// Invite Response Enum
export enum InviteResponse {
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  NO_AVAILABILITY = "NO_AVAILABILITY",
}

// Discharge Case Interface
export interface DischargeCase {
  id: string;
  caseNumber: string;
  hospitalId: string;
  socialWorkerId: string;
  hospitalStaffId?: string;
  
  // Patient (Minimal PHI)
  patientInitials: string;
  patientAge: number;
  patientGender: Gender;
  
  // Medical
  diagnosisCodes: string[];
  mobilityStatus: string;
  cognitiveStatus?: string;
  behavioralConcerns: string[];
  
  // Equipment Needs
  dmeNeeds: string[];
  medicationManagement: boolean;
  
  // Discharge Planning
  currentLocation: string;
  targetDischargeDate: string | Date;
  actualDischargeDate?: string | Date;
  
  // Geography
  preferredCounties: string[];
  preferredCities: string[];
  requiresProximity: boolean;
  proximityZipCode?: string;
  maxDistanceMiles?: number;
  
  // Payer
  primaryInsurance: Payer;
  secondaryInsurance?: Payer;
  
  // Status
  status: DischargeStatus;
  
  // Transport
  needsTransport: boolean;
  transportType?: string;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
  matchedAt?: string | Date;
  invitesSentAt?: string | Date;
  placedAt?: string | Date;
  
  // Relations
  socialWorker?: User;
  hospitalStaff?: HospitalStaff;
  invitations?: DischargeInvitation[];
  messages?: MessageThread[];
  placement?: Placement;
  transportBooking?: TransportBooking;
  checklist?: DischargeChecklist;
  consent?: Consent;
}

// Discharge Invitation Interface
export interface DischargeInvitation {
  id: string;
  dischargeCaseId: string;
  providerId: string;
  provider?: Provider;
  
  invitedAt: string | Date;
  expiresAt: string | Date;
  respondedAt?: string | Date;
  
  response?: InviteResponse;
  responseNotes?: string;
  
  reminderSentAt?: string | Date;
  escalatedAt?: string | Date;
}

// Discharge Checklist Interface
export interface DischargeChecklist {
  id: string;
  dischargeCaseId: string;
  
  // Pre-discharge
  consentObtained: boolean;
  insuranceVerified: boolean;
  medsReconciled: boolean;
  equipmentOrdered: boolean;
  transportArranged: boolean;
  
  // During discharge
  patientEducated: boolean;
  documentsSent: boolean;
  followUpScheduled: boolean;
  
  // Post-discharge
  day1Contact: boolean;
  day2Contact: boolean;
  day7Contact: boolean;
  day30Contact: boolean;
  
  updatedAt: string | Date;
}

// Create/Update Discharge Case Data
export interface CreateDischargeCaseData {
  hospitalId: string;
  patientInitials: string;
  patientAge: number;
  patientGender: Gender;
  diagnosisCodes: string[];
  mobilityStatus: string;
  cognitiveStatus?: string;
  behavioralConcerns: string[];
  dmeNeeds: string[];
  medicationManagement: boolean;
  currentLocation: string;
  targetDischargeDate: string | Date;
  preferredCounties: string[];
  preferredCities: string[];
  requiresProximity: boolean;
  proximityZipCode?: string;
  maxDistanceMiles?: number;
  primaryInsurance: Payer;
  secondaryInsurance?: Payer;
  needsTransport: boolean;
  transportType?: string;
}

export interface UpdateDischargeCaseData extends Partial<CreateDischargeCaseData> {
  status?: DischargeStatus;
  actualDischargeDate?: string | Date;
}

// Discharge Case Filters
export interface DischargeCaseFilters {
  status?: DischargeStatus;
  hospitalId?: string;
  socialWorkerId?: string;
  search?: string;
  targetDischargeDateFrom?: string | Date;
  targetDischargeDateTo?: string | Date;
  page?: number;
  limit?: number;
}

// Hospital SW Dashboard Stats
export interface HospitalSWDashboard {
  stats: {
    activeCases: number;
    pendingPlacements: number;
    completedThisMonth: number;
    urgentCases: number;
  };
  recentCases: DischargeCase[];
  upcomingDischarges: DischargeCase[];
}

// Hospital SW Analytics
export interface HospitalSWAnalytics {
  summary: {
    totalCases: number;
    activeCases: number;
    completedCases: number;
    cancelledCases: number;
  };
  statusBreakdown: {
    status: DischargeStatus;
    count: number;
    percentage: number;
  }[];
  averagePlacementTime: number; // hours
  responseRate: number; // percentage
  payerMix: {
    payer: Payer;
    count: number;
    percentage: number;
  }[];
  transportStats: {
    totalWithTransport: number;
    transportTypes: {
      type: string;
      count: number;
    }[];
  };
}
```

### 1.2 Shared Constants (`apps/web/src/lib/constants/index.ts`)

**Discharge Status Configuration:**
```typescript
export const DISCHARGE_STATUS_CONFIG: Record<
  DischargeStatus,
  {
    label: string;
    color: string;
    variant: BadgeProps["variant"];
    icon: LucideIcon;
  }
> = {
  INTAKE: {
    label: "Intake",
    color: "hsl(var(--muted-foreground))",
    variant: "outline",
    icon: FileText,
  },
  MATCHING: {
    label: "Matching",
    color: "hsl(var(--primary))",
    variant: "healthcare",
    icon: Search,
  },
  INVITES_SENT: {
    label: "Invites Sent",
    color: "hsl(var(--primary))",
    variant: "healthcare",
    icon: Send,
  },
  RESPONSES_PENDING: {
    label: "Awaiting Responses",
    color: "hsl(var(--warning))",
    variant: "healthcareWarning",
    icon: Clock,
  },
  PLACEMENT_CONFIRMED: {
    label: "Placement Confirmed",
    color: "hsl(var(--success))",
    variant: "healthcareSuccess",
    icon: CheckCircle,
  },
  DISCHARGED: {
    label: "Discharged",
    color: "hsl(var(--success))",
    variant: "healthcareSuccess",
    icon: CheckCircle,
  },
  FOLLOW_UP: {
    label: "Follow Up",
    color: "hsl(var(--accent))",
    variant: "healthcare",
    icon: Calendar,
  },
  COMPLETED: {
    label: "Completed",
    color: "hsl(var(--success))",
    variant: "healthcareSuccess",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "hsl(var(--destructive))",
    variant: "destructive",
    icon: XCircle,
  },
};

// Transport Types
export const TRANSPORT_TYPES = [
  { value: "AMBULANCE", label: "Ambulance" },
  { value: "WHEELCHAIR_VAN", label: "Wheelchair Van" },
  { value: "MEDICAL_TRANSPORT", label: "Medical Transport" },
  { value: "FAMILY_TRANSPORT", label: "Family Transport" },
  { value: "OTHER", label: "Other" },
] as const;

// Mobility Status Options
export const MOBILITY_STATUS_OPTIONS = [
  { value: "AMBULATORY", label: "Ambulatory" },
  { value: "WHEELCHAIR", label: "Wheelchair" },
  { value: "BEDBOUND", label: "Bedbound" },
  { value: "ASSISTED_WALKING", label: "Assisted Walking" },
] as const;

// Cognitive Status Options
export const COGNITIVE_STATUS_OPTIONS = [
  { value: "ALERT", label: "Alert & Oriented" },
  { value: "CONFUSED", label: "Confused" },
  { value: "DEMENTIA", label: "Dementia" },
  { value: "COMA", label: "Coma" },
] as const;

// DME Needs Options
export const DME_NEEDS_OPTIONS = [
  { value: "WHEELCHAIR", label: "Wheelchair" },
  { value: "WALKER", label: "Walker" },
  { value: "HOSPITAL_BED", label: "Hospital Bed" },
  { value: "OXYGEN", label: "Oxygen Equipment" },
  { value: "CPAP", label: "CPAP Machine" },
  { value: "LIFT", label: "Patient Lift" },
] as const;

// Behavioral Concerns Options
export const BEHAVIORAL_CONCERNS_OPTIONS = [
  { value: "WANDERING", label: "Wandering" },
  { value: "AGGRESSION", label: "Aggression" },
  { value: "SELF_HARM", label: "Self-Harm Risk" },
  { value: "ELOPEMENT", label: "Elopement Risk" },
  { value: "SUNDOWNING", label: "Sundowning" },
] as const;

// Hospital Locations
export const HOSPITAL_LOCATIONS = [
  { value: "ICU", label: "ICU" },
  { value: "MEDICAL_FLOOR", label: "Medical Floor" },
  { value: "SURGICAL_FLOOR", label: "Surgical Floor" },
  { value: "REHAB", label: "Rehabilitation" },
  { value: "ER", label: "Emergency Room" },
  { value: "OTHER", label: "Other" },
] as const;
```

### 1.3 Shared Utilities (`apps/web/src/lib/utils/hospital-sw.ts`)

```typescript
/**
 * Hospital Social Worker utility functions
 * Shared utilities for hospital SW-related operations
 */

import { DischargeCase, DischargeStatus } from "@carelink/types";
import { DISCHARGE_STATUS_CONFIG } from "@/lib/constants";
import type { BadgeProps } from "@/components/ui/badge";

/**
 * Validate discharge case data
 */
export function isValidDischargeCase(case: {
  id?: string;
  hospitalId?: string;
  socialWorkerId?: string;
}): boolean {
  return !!(case?.id && case?.hospitalId && case?.socialWorkerId);
}

/**
 * Get discharge status badge configuration
 */
export function getDischargeStatusBadge(status: DischargeStatus) {
  return DISCHARGE_STATUS_CONFIG[status] || DISCHARGE_STATUS_CONFIG.INTAKE;
}

/**
 * Check if discharge case is urgent (target discharge date within 24 hours)
 */
export function isUrgentDischargeCase(case: DischargeCase): boolean {
  const targetDate = new Date(case.targetDischargeDate);
  const now = new Date();
  const hoursUntilDischarge = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilDischarge <= 24 && hoursUntilDischarge > 0;
}

/**
 * Check if discharge case is overdue (target discharge date passed)
 */
export function isOverdueDischargeCase(case: DischargeCase): boolean {
  const targetDate = new Date(case.targetDischargeDate);
  const now = new Date();
  return targetDate < now && case.status !== DischargeStatus.DISCHARGED && case.status !== DischargeStatus.COMPLETED;
}

/**
 * Get days until target discharge
 */
export function getDaysUntilDischarge(case: DischargeCase): number {
  const targetDate = new Date(case.targetDischargeDate);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format discharge case number for display
 */
export function formatDischargeCaseNumber(caseNumber: string): string {
  return `DC-${caseNumber.toUpperCase()}`;
}
```

### 1.4 API Service (`apps/web/src/lib/api/services/discharge-case.service.ts`)

```typescript
import { apiService } from '../config';
import {
  ApiResponse,
  DischargeCase,
  CreateDischargeCaseData,
  UpdateDischargeCaseData,
  DischargeCaseFilters,
  DischargeInvitation,
  DischargeChecklist,
} from '@carelink/types';

export class DischargeCaseService {
  /**
   * Get all discharge cases with filters
   */
  async getDischargeCases(
    filters?: DischargeCaseFilters
  ): Promise<ApiResponse<{ cases: DischargeCase[]; pagination: PaginationResponse }>> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.hospitalId) queryParams.append('hospitalId', filters.hospitalId);
    if (filters?.socialWorkerId) queryParams.append('socialWorkerId', filters.socialWorkerId);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.targetDischargeDateFrom) queryParams.append('targetDischargeDateFrom', filters.targetDischargeDateFrom.toString());
    if (filters?.targetDischargeDateTo) queryParams.append('targetDischargeDateTo', filters.targetDischargeDateTo.toString());
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    return apiService.get(`/api/discharge-cases?${queryParams.toString()}`);
  }

  /**
   * Get discharge case by ID
   */
  async getDischargeCaseById(id: string): Promise<ApiResponse<DischargeCase>> {
    return apiService.get(`/api/discharge-cases/${id}`);
  }

  /**
   * Create new discharge case
   */
  async createDischargeCase(
    data: CreateDischargeCaseData
  ): Promise<ApiResponse<DischargeCase>> {
    return apiService.post('/api/discharge-cases', data);
  }

  /**
   * Update discharge case
   */
  async updateDischargeCase(
    id: string,
    data: UpdateDischargeCaseData
  ): Promise<ApiResponse<DischargeCase>> {
    return apiService.put(`/api/discharge-cases/${id}`, data);
  }

  /**
   * Delete discharge case
   */
  async deleteDischargeCase(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/api/discharge-cases/${id}`);
  }

  /**
   * Get discharge case invitations
   */
  async getDischargeCaseInvitations(
    caseId: string
  ): Promise<ApiResponse<DischargeInvitation[]>> {
    return apiService.get(`/api/discharge-cases/${caseId}/invitations`);
  }

  /**
   * Send provider invitations
   */
  async sendProviderInvitations(
    caseId: string,
    providerIds: string[]
  ): Promise<ApiResponse<DischargeInvitation[]>> {
    return apiService.post(`/api/discharge-cases/${caseId}/invitations`, {
      providerIds,
    });
  }

  /**
   * Get discharge checklist
   */
  async getDischargeChecklist(
    caseId: string
  ): Promise<ApiResponse<DischargeChecklist>> {
    return apiService.get(`/api/discharge-cases/${caseId}/checklist`);
  }

  /**
   * Update discharge checklist
   */
  async updateDischargeChecklist(
    caseId: string,
    checklist: Partial<DischargeChecklist>
  ): Promise<ApiResponse<DischargeChecklist>> {
    return apiService.put(`/api/discharge-cases/${caseId}/checklist`, checklist);
  }

  /**
   * Trigger AI matching for discharge case
   */
  async triggerAIMatching(caseId: string): Promise<ApiResponse<{ providers: Provider[]; explanation: string }>> {
    return apiService.post(`/api/discharge-cases/${caseId}/ai-matching`);
  }
}

export const dischargeCaseService = new DischargeCaseService();
```

### 1.5 Hooks (`apps/web/src/hooks/use-hospital-sw-data.ts`)

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { dischargeCaseService } from '@/lib/api';
import { DischargeCase, DischargeCaseFilters } from '@carelink/types';

/**
 * Hook to get hospital SW user ID
 */
export function useHospitalSWId(): string | null {
  const { user } = useAuth();
  // Implementation similar to useProviderId or useCaseManagerId
  // This would fetch the hospital staff profile associated with the user
  return user?.id || null;
}

/**
 * Hook to fetch discharge cases
 */
export function useDischargeCases(filters?: DischargeCaseFilters) {
  const [cases, setCases] = useState<DischargeCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await dischargeCaseService.getDischargeCases(filters);
        if (response.success && response.data) {
          setCases(response.data.cases);
          setPagination(response.data.pagination);
        } else {
          setError(new Error(response.message || 'Failed to fetch discharge cases'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, [JSON.stringify(filters)]);

  return { cases, isLoading, error, pagination, refetch: () => fetchCases() };
}
```

---

## Phase 2: Backend Implementation

### 2.1 Backend Service (`packages/api/src/services/discharge-case.service.ts`)

- CRUD operations for discharge cases
- AI matching integration
- Provider invitation management
- Checklist management
- PHI protection and audit logging

### 2.2 Backend Controller (`packages/api/src/controllers/discharge-case.controller.ts`)

- RESTful API endpoints
- Request validation
- Permission checks
- Error handling

### 2.3 Backend Routes (`packages/api/src/routes/discharge-case.routes.ts`)

```typescript
// Routes with permission checks
POST   /api/discharge-cases
GET    /api/discharge-cases
GET    /api/discharge-cases/:id
PUT    /api/discharge-cases/:id
DELETE /api/discharge-cases/:id
POST   /api/discharge-cases/:id/ai-matching
POST   /api/discharge-cases/:id/invitations
GET    /api/discharge-cases/:id/invitations
PUT    /api/discharge-cases/:id/checklist
GET    /api/discharge-cases/:id/checklist
```

---

## Phase 3: Frontend Pages

### 3.1 Dashboard (`apps/web/src/app/hospital-sw/(dashboard)/dashboard/page.tsx`)

**Features:**
- Summary statistics (active cases, pending placements, completed this month, urgent cases)
- Recent discharge cases
- Upcoming discharges (within 24 hours)
- Quick actions (create case, view all cases, urgent cases)
- Charts/graphs for analytics

**Permissions:**
- `HOSPITAL_SW_CAPABILITIES.DASHBOARD_VIEW`

### 3.2 Discharge Cases List (`apps/web/src/app/hospital-sw/(dashboard)/discharge-cases/page.tsx`)

**Features:**
- Table/Kanban view of discharge cases
- Filters (status, date range, search)
- Bulk actions
- Status badges
- Urgency indicators
- Quick actions (view, edit, delete)

**Permissions:**
- `HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_VIEW`
- Conditional actions based on `DISCHARGE_CASES_UPDATE` and `DISCHARGE_CASES_DELETE`

### 3.3 Create Discharge Case (`apps/web/src/app/hospital-sw/(dashboard)/discharge-cases/create/page.tsx`)

**Features:**
- Multi-step form (similar to referral creation)
- Patient information (minimal PHI)
- Medical needs
- Geographic preferences
- Payer information
- Transport requirements
- Validation

**Permissions:**
- `HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_CREATE`

### 3.4 Discharge Case Detail (`apps/web/src/app/hospital-sw/(dashboard)/discharge-cases/[caseId]/page.tsx`)

**Features:**
- Case overview
- Status timeline
- Provider invitations management
- AI matching results
- Checklist management
- Messages/communication
- Transport booking
- Placement information

**Permissions:**
- `HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_VIEW`
- Conditional actions based on update/delete permissions

### 3.5 Provider Invitations (`apps/web/src/app/hospital-sw/(dashboard)/discharge-cases/[caseId]/invitations/page.tsx`)

**Features:**
- List of sent invitations
- Invitation status tracking
- Resend invitations
- Escalate to alternates
- Response management

**Permissions:**
- `HOSPITAL_SW_CAPABILITIES.PROVIDER_INVITATIONS_MANAGE`

### 3.6 Analytics (`apps/web/src/app/hospital-sw/(dashboard)/analytics/page.tsx`)

**Features:**
- Case statistics
- Status breakdown charts
- Average placement time
- Response rate metrics
- Payer mix analysis
- Transport statistics
- Export functionality

**Permissions:**
- `HOSPITAL_SW_CAPABILITIES.ANALYTICS_VIEW`

### 3.7 Settings (`apps/web/src/app/hospital-sw/(dashboard)/settings/page.tsx`)

**Features:**
- Profile management
- Notification preferences
- Default settings

**Permissions:**
- `HOSPITAL_SW_CAPABILITIES.PROFILE_MANAGE`

---

## Phase 4: Components

### 4.1 Discharge Case Components

- `DischargeCaseCard` - Card view for discharge cases
- `DischargeCaseTable` - Table view with columns
- `DischargeCaseKanban` - Kanban board view
- `DischargeCaseForm` - Create/edit form
- `DischargeCaseStatusBadge` - Status badge component
- `DischargeCaseFilters` - Filter component
- `DischargeCaseActions` - Action menu
- `DischargeChecklistCard` - Checklist display/editing
- `ProviderInvitationList` - Invitation management
- `AIMatchingResults` - AI matching results display

### 4.2 Shared Components

- Reuse components from Provider/Case Manager where applicable
- `AccessRestricted` for permission denial
- `RequirePermission` guard component
- `StatsCard` for dashboard statistics
- `SearchFilterBar` for filtering

---

## Phase 5: Layout & Navigation

### 5.1 Dashboard Layout (`apps/web/src/app/hospital-sw/(dashboard)/layout.tsx`)

- Similar structure to provider/case manager layouts
- Sidebar navigation
- Permission-based menu items
- Onboarding guard

### 5.2 Sidebar Navigation

Update `apps/web/src/components/layout/sidebar.tsx` to include Hospital SW menu items:
- Dashboard
- Discharge Cases
- Analytics
- Settings

---

## Phase 6: Testing & Validation

### 6.1 Permission Testing
- Verify all routes have proper permission checks
- Test conditional rendering based on permissions
- Verify API calls are protected

### 6.2 Functionality Testing
- Create/edit/delete discharge cases
- Provider invitation workflow
- AI matching integration
- Checklist management
- Analytics data accuracy

### 6.3 UI/UX Testing
- Responsive design
- Loading states
- Error handling
- Form validation
- Accessibility

---

## Implementation Order

1. **Phase 1**: Foundation (Types, Constants, Utils, API Service, Hooks)
2. **Phase 2**: Backend (Service, Controller, Routes)
3. **Phase 3.1**: Dashboard page
4. **Phase 3.2**: Discharge Cases List page
5. **Phase 3.3**: Create Discharge Case page
6. **Phase 3.4**: Discharge Case Detail page
7. **Phase 3.5**: Provider Invitations page
8. **Phase 3.6**: Analytics page
9. **Phase 3.7**: Settings page
10. **Phase 4**: Components (as needed for pages)
11. **Phase 5**: Layout & Navigation
12. **Phase 6**: Testing & Validation

---

## Consistency Checklist

- [ ] All types exported from `@carelink/types`
- [ ] All constants in `apps/web/src/lib/constants/index.ts`
- [ ] All utilities in `apps/web/src/lib/utils/hospital-sw.ts`
- [ ] All API services follow same pattern as provider/case manager
- [ ] All hooks follow same pattern
- [ ] All pages use `RequirePermission` guard
- [ ] All pages use `AccessRestricted` for permission denial
- [ ] All pages use `usePageMetadata` hook
- [ ] All forms use React Hook Form + Zod validation
- [ ] All API calls use centralized service
- [ ] All error handling uses toast notifications
- [ ] All loading states use consistent UI
- [ ] All permissions checked on both frontend and backend

---

## Notes

- Follow the exact same patterns as Provider and Case Manager dashboards
- Reuse shared components wherever possible
- Ensure all permission strings match between frontend and backend
- Maintain consistent naming conventions
- Document any deviations from standard patterns
- Ensure PHI protection and audit logging for all discharge case operations


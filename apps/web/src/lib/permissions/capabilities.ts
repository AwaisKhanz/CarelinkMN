"use client";

import { UserRole } from "@carelink/types";

/**
 * Comprehensive capability definitions for all user roles.
 * Based on PRD (docs/01-PRD-Product-Requirements.md) and schema (packages/database/prisma/schema.prisma).
 */

// ============================================
// PROVIDER CAPABILITIES
// ============================================
export const PROVIDER_CAPABILITIES = {
  DASHBOARD_VIEW: "provider:dashboard:view",
  PROFILE_MANAGE: "provider:profile:manage",
  HOMES_MANAGE: "provider:homes:manage",
  OPENINGS_MANAGE: "provider:openings:manage",
  SERVICES_MANAGE: "provider:services:manage",
  PLACEMENTS_MANAGE: "provider:placements:manage",
  LICENSES_MANAGE: "provider:licenses:manage",
  RESIDENTS_VIEW: "provider:residents:view",
  STAFF_MANAGE: "provider:staff:manage",
  BILLING_MANAGE: "provider:billing:manage",
  ANALYTICS_VIEW: "provider:analytics:view",
  REFERRALS_VIEW: "provider:referrals:view",
  REFERRALS_RESPOND: "provider:referrals:respond",
  MESSAGES_MANAGE: "provider:messages:manage",
  SETTINGS_MANAGE: "provider:settings:manage",
} as const;

// ============================================
// CASE MANAGER CAPABILITIES
// ============================================
export const CASE_MANAGER_CAPABILITIES = {
  DASHBOARD_VIEW: "case_manager:dashboard:view",
  REFERRALS_CREATE: "case_manager:referrals:create",
  REFERRALS_VIEW: "case_manager:referrals:view",
  REFERRALS_UPDATE: "case_manager:referrals:update",
  REFERRALS_DELETE: "case_manager:referrals:delete",
  REFERRALS_ASSIGN: "case_manager:referrals:assign",
  REFERRALS_TRACK: "case_manager:referrals:track",
  SEARCH_VIEW: "case_manager:search:view",
  SEARCH_AI_ASSISTED: "case_manager:search:ai_assisted",
  SHORTLIST_MANAGE: "case_manager:shortlist:manage",
  BATCH_OUTREACH: "case_manager:batch:outreach",
  PIPELINE_VIEW: "case_manager:pipeline:view",
  PIPELINE_KANBAN: "case_manager:pipeline:kanban",
  EXPORT_DATA: "case_manager:export:data",
  PROVIDERS_VIEW: "case_manager:providers:view",
  MESSAGES_MANAGE: "case_manager:messages:manage",
  ANALYTICS_VIEW: "case_manager:analytics:view",
  PROFILE_MANAGE: "case_manager:profile:manage",
} as const;

// ============================================
// HOSPITAL SOCIAL WORKER CAPABILITIES
// ============================================
export const HOSPITAL_SW_CAPABILITIES = {
  DASHBOARD_VIEW: "hospital_sw:dashboard:view",
  DISCHARGE_CASES_CREATE: "hospital_sw:discharge_cases:create",
  DISCHARGE_CASES_VIEW: "hospital_sw:discharge_cases:view",
  DISCHARGE_CASES_UPDATE: "hospital_sw:discharge_cases:update",
  DISCHARGE_CASES_DELETE: "hospital_sw:discharge_cases:delete",
  INTAKE_FORMS_MANAGE: "hospital_sw:intake_forms:manage",
  AI_MATCHING_USE: "hospital_sw:ai_matching:use",
  PROVIDER_INVITATIONS_SEND: "hospital_sw:provider_invitations:send",
  PROVIDER_INVITATIONS_MANAGE: "hospital_sw:provider_invitations:manage",
  NEMT_BOOKING_MANAGE: "hospital_sw:nemt_booking:manage",
  CHECKLISTS_MANAGE: "hospital_sw:checklists:manage",
  PROVIDERS_VIEW: "hospital_sw:providers:view",
  MESSAGES_MANAGE: "hospital_sw:messages:manage",
  ANALYTICS_VIEW: "hospital_sw:analytics:view",
  PROFILE_MANAGE: "hospital_sw:profile:manage",
  CONSENT_MANAGE: "hospital_sw:consent:manage",
} as const;

// ============================================
// VRS SPECIALIST CAPABILITIES
// ============================================
export const VRS_CAPABILITIES = {
  DASHBOARD_VIEW: "vrs:dashboard:view",
  CLIENTS_CREATE: "vrs:clients:create",
  CLIENTS_VIEW: "vrs:clients:view",
  CLIENTS_UPDATE: "vrs:clients:update",
  CLIENTS_DELETE: "vrs:clients:delete",
  JOBS_CREATE: "vrs:jobs:create",
  JOBS_VIEW: "vrs:jobs:view",
  JOBS_UPDATE: "vrs:jobs:update",
  JOBS_DELETE: "vrs:jobs:delete",
  JOB_MATCHING_USE: "vrs:job_matching:use",
  EMPLOYERS_VIEW: "vrs:employers:view",
  EMPLOYERS_MANAGE: "vrs:employers:manage",
  PLACEMENTS_CREATE: "vrs:placements:create",
  PLACEMENTS_VIEW: "vrs:placements:view",
  PLACEMENTS_UPDATE: "vrs:placements:update",
  RETENTION_ANALYTICS_VIEW: "vrs:retention_analytics:view",
  ANALYTICS_VIEW: "vrs:analytics:view",
  PROFILE_MANAGE: "vrs:profile:manage",
} as const;

// ============================================
// VENDOR CAPABILITIES
// ============================================
export const VENDOR_CAPABILITIES = {
  DASHBOARD_VIEW: "vendor:dashboard:view",
  PROFILE_MANAGE: "vendor:profile:manage",
  SERVICES_MANAGE: "vendor:services:manage",
  LEADS_VIEW: "vendor:leads:view",
  LEADS_MANAGE: "vendor:leads:manage",
  BOOKINGS_VIEW: "vendor:bookings:view",
  BOOKINGS_MANAGE: "vendor:bookings:manage",
  ANALYTICS_VIEW: "vendor:analytics:view",
  SPONSORSHIP_MANAGE: "vendor:sponsorship:manage",
} as const;

// ============================================
// SYSTEM CAPABILITIES (Admin/Super Admin)
// ============================================
export const SYSTEM_CAPABILITIES = {
  SYSTEM_MANAGE: "system:manage",
  SYSTEM_VIEW: "system:view",
  USERS_MANAGE: "system:users:manage",
  ORGANIZATIONS_MANAGE: "system:organizations:manage",
  PROVIDERS_APPROVE: "system:providers:approve",
  PROVIDERS_VERIFY: "system:providers:verify",
  LICENSES_VERIFY: "system:licenses:verify",
  SERVICES_MANAGE: "services:manage",
  AUDIT_VIEW: "system:audit:view",
  COMPLIANCE_VIEW: "system:compliance:view",
  COMPLIANCE_MANAGE: "system:compliance:manage",
  ANALYTICS_SYSTEM: "system:analytics:system",
} as const;

// ============================================
// TYPE DEFINITIONS
// ============================================
export type ProviderCapability =
  (typeof PROVIDER_CAPABILITIES)[keyof typeof PROVIDER_CAPABILITIES];

export type CaseManagerCapability =
  (typeof CASE_MANAGER_CAPABILITIES)[keyof typeof CASE_MANAGER_CAPABILITIES];

export type HospitalSWCapability =
  (typeof HOSPITAL_SW_CAPABILITIES)[keyof typeof HOSPITAL_SW_CAPABILITIES];

export type VRSCapability =
  (typeof VRS_CAPABILITIES)[keyof typeof VRS_CAPABILITIES];

export type VendorCapability =
  (typeof VENDOR_CAPABILITIES)[keyof typeof VENDOR_CAPABILITIES];

export type SystemCapability =
  (typeof SYSTEM_CAPABILITIES)[keyof typeof SYSTEM_CAPABILITIES];

export type Capability =
  | ProviderCapability
  | CaseManagerCapability
  | HospitalSWCapability
  | VRSCapability
  | VendorCapability
  | SystemCapability;

// ============================================
// ROLE CAPABILITY MAPPING
// ============================================
export const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  [UserRole.PROVIDER_OWNER]: [...Object.values(PROVIDER_CAPABILITIES)],

  [UserRole.PROVIDER_STAFF]: [
    // Day-to-day operations only, no billing/staff management
    PROVIDER_CAPABILITIES.DASHBOARD_VIEW,
    PROVIDER_CAPABILITIES.PROFILE_MANAGE,
    PROVIDER_CAPABILITIES.HOMES_MANAGE,
    PROVIDER_CAPABILITIES.OPENINGS_MANAGE,
    PROVIDER_CAPABILITIES.SERVICES_MANAGE,
    PROVIDER_CAPABILITIES.PLACEMENTS_MANAGE,
    PROVIDER_CAPABILITIES.LICENSES_MANAGE,
    PROVIDER_CAPABILITIES.RESIDENTS_VIEW,
    PROVIDER_CAPABILITIES.ANALYTICS_VIEW,
    PROVIDER_CAPABILITIES.REFERRALS_VIEW,
    PROVIDER_CAPABILITIES.REFERRALS_RESPOND,
    PROVIDER_CAPABILITIES.MESSAGES_MANAGE,
    // Explicitly excluded: STAFF_MANAGE, BILLING_MANAGE, SETTINGS_MANAGE
  ],

  [UserRole.CASE_MANAGER]: [...Object.values(CASE_MANAGER_CAPABILITIES)],

  [UserRole.HOSPITAL_SW]: [...Object.values(HOSPITAL_SW_CAPABILITIES)],

  [UserRole.VRS_SPECIALIST]: [...Object.values(VRS_CAPABILITIES)],

  [UserRole.VENDOR]: [...Object.values(VENDOR_CAPABILITIES)],

  [UserRole.SUPER_ADMIN]: [
    ...Object.values(PROVIDER_CAPABILITIES),
    ...Object.values(CASE_MANAGER_CAPABILITIES),
    ...Object.values(HOSPITAL_SW_CAPABILITIES),
    ...Object.values(VRS_CAPABILITIES),
    ...Object.values(VENDOR_CAPABILITIES),
    ...Object.values(SYSTEM_CAPABILITIES),
  ],

  [UserRole.ADMIN]: [
    // Admin has most capabilities except system-level management
    ...Object.values(PROVIDER_CAPABILITIES),
    ...Object.values(CASE_MANAGER_CAPABILITIES),
    ...Object.values(HOSPITAL_SW_CAPABILITIES),
    ...Object.values(VRS_CAPABILITIES),
    ...Object.values(VENDOR_CAPABILITIES),
    SYSTEM_CAPABILITIES.USERS_MANAGE,
    SYSTEM_CAPABILITIES.ORGANIZATIONS_MANAGE,
    SYSTEM_CAPABILITIES.PROVIDERS_APPROVE,
    SYSTEM_CAPABILITIES.PROVIDERS_VERIFY,
    SYSTEM_CAPABILITIES.LICENSES_VERIFY,
    SYSTEM_CAPABILITIES.SERVICES_MANAGE,
    SYSTEM_CAPABILITIES.AUDIT_VIEW,
    SYSTEM_CAPABILITIES.COMPLIANCE_VIEW,
    SYSTEM_CAPABILITIES.COMPLIANCE_MANAGE,
  ],

  [UserRole.PUBLIC]: [],
};

/**
 * Get all capabilities for a given role
 */
export function getRoleCapabilities(role?: UserRole | null): Capability[] {
  if (!role) return [];
  return ROLE_CAPABILITIES[role] || [];
}

/**
 * Check if a role has a specific capability
 */
export function hasCapability(
  role: UserRole | null | undefined,
  capability: Capability
): boolean {
  if (!role) return false;
  const capabilities = getRoleCapabilities(role);
  return capabilities.includes(capability);
}

/**
 * Check if a role has any of the specified capabilities
 */
export function hasAnyCapability(
  role: UserRole | null | undefined,
  capabilities: Capability[]
): boolean {
  if (!role) return false;
  const roleCapabilities = getRoleCapabilities(role);
  return capabilities.some((cap) => roleCapabilities.includes(cap));
}

/**
 * Check if a role has all of the specified capabilities
 */
export function hasAllCapabilities(
  role: UserRole | null | undefined,
  capabilities: Capability[]
): boolean {
  if (!role) return false;
  const roleCapabilities = getRoleCapabilities(role);
  return capabilities.every((cap) => roleCapabilities.includes(cap));
}

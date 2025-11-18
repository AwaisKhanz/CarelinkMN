"use client";

import { useAuth } from "@/contexts/auth-context";
import {
  PROVIDER_CAPABILITIES,
  CASE_MANAGER_CAPABILITIES,
  HOSPITAL_SW_CAPABILITIES,
  VRS_CAPABILITIES,
  VENDOR_CAPABILITIES,
  SYSTEM_CAPABILITIES,
  getRoleCapabilities,
  hasCapability,
  hasAnyCapability,
  hasAllCapabilities,
  type Capability,
} from "@/lib/permissions/capabilities";
import { UserRole } from "@carelink/types";

/**
 * Universal permission hook that works for all roles.
 * Automatically detects user role and provides appropriate permission checks.
 */
export function useRolePermissions() {
  const { user } = useAuth();
  const role = user?.role;
  const capabilities = getRoleCapabilities(role);

  return {
    // Core permission check functions
    hasCapability: (capability: Capability) => hasCapability(role, capability),
    hasAnyCapability: (capabilities: Capability[]) =>
      hasAnyCapability(role, capabilities),
    hasAllCapabilities: (capabilities: Capability[]) =>
      hasAllCapabilities(role, capabilities),

    // Role checks
    isProviderOwner: role === UserRole.PROVIDER_OWNER,
    isProviderStaff: role === UserRole.PROVIDER_STAFF,
    isCaseManager: role === UserRole.CASE_MANAGER,
    isHospitalSW: role === UserRole.HOSPITAL_SW,
    isVRSSpecialist: role === UserRole.VRS_SPECIALIST,
    isVendor: role === UserRole.VENDOR,
    isAdmin: role === UserRole.ADMIN,
    isSuperAdmin: role === UserRole.SUPER_ADMIN,

    // Provider-specific checks (backward compatible)
    canManageHomes: hasCapability(role, PROVIDER_CAPABILITIES.HOMES_MANAGE),
    canManageOpenings: hasCapability(
      role,
      PROVIDER_CAPABILITIES.OPENINGS_MANAGE
    ),
    canManageServices: hasCapability(
      role,
      PROVIDER_CAPABILITIES.SERVICES_MANAGE
    ),
    canManagePlacements: hasCapability(
      role,
      PROVIDER_CAPABILITIES.PLACEMENTS_MANAGE
    ),
    canManageLicenses: hasCapability(
      role,
      PROVIDER_CAPABILITIES.LICENSES_MANAGE
    ),
    canManageStaff: hasCapability(role, PROVIDER_CAPABILITIES.STAFF_MANAGE),
    canManageBilling: hasCapability(role, PROVIDER_CAPABILITIES.BILLING_MANAGE),
    canViewAnalytics: hasCapability(role, PROVIDER_CAPABILITIES.ANALYTICS_VIEW),
    canViewReferrals: hasCapability(role, PROVIDER_CAPABILITIES.REFERRALS_VIEW),
    canRespondToReferrals: hasCapability(
      role,
      PROVIDER_CAPABILITIES.REFERRALS_RESPOND
    ),
    canManageMessages: hasCapability(
      role,
      PROVIDER_CAPABILITIES.MESSAGES_MANAGE
    ),
    canViewResidents: hasCapability(role, PROVIDER_CAPABILITIES.RESIDENTS_VIEW),
    canManageProfile: hasCapability(role, PROVIDER_CAPABILITIES.PROFILE_MANAGE),
    canViewDashboard: hasCapability(role, PROVIDER_CAPABILITIES.DASHBOARD_VIEW),
    canManageSettings: hasCapability(
      role,
      PROVIDER_CAPABILITIES.SETTINGS_MANAGE
    ),

    // Case Manager checks
    canCreateReferrals: hasCapability(
      role,
      CASE_MANAGER_CAPABILITIES.REFERRALS_CREATE
    ),
    canUpdateReferrals: hasCapability(
      role,
      CASE_MANAGER_CAPABILITIES.REFERRALS_UPDATE
    ),
    canDeleteReferrals: hasCapability(
      role,
      CASE_MANAGER_CAPABILITIES.REFERRALS_DELETE
    ),
    canAssignReferrals: hasCapability(
      role,
      CASE_MANAGER_CAPABILITIES.REFERRALS_ASSIGN
    ),
    canUseAISearch: hasCapability(
      role,
      CASE_MANAGER_CAPABILITIES.SEARCH_AI_ASSISTED
    ),
    canBatchOutreach: hasCapability(
      role,
      CASE_MANAGER_CAPABILITIES.BATCH_OUTREACH
    ),
    canViewPipeline: hasCapability(
      role,
      CASE_MANAGER_CAPABILITIES.PIPELINE_VIEW
    ),
    canExportData: hasCapability(role, CASE_MANAGER_CAPABILITIES.EXPORT_DATA),

    // Hospital SW checks
    canCreateDischargeCases: hasCapability(
      role,
      HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_CREATE
    ),
    canUpdateDischargeCases: hasCapability(
      role,
      HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_UPDATE
    ),
    canUseAIMatching: hasCapability(
      role,
      HOSPITAL_SW_CAPABILITIES.AI_MATCHING_USE
    ),
    canSendProviderInvitations: hasCapability(
      role,
      HOSPITAL_SW_CAPABILITIES.PROVIDER_INVITATIONS_SEND
    ),
    canManageNEMT: hasCapability(
      role,
      HOSPITAL_SW_CAPABILITIES.NEMT_BOOKING_MANAGE
    ),
    canManageChecklists: hasCapability(
      role,
      HOSPITAL_SW_CAPABILITIES.CHECKLISTS_MANAGE
    ),
    canManageConsent: hasCapability(
      role,
      HOSPITAL_SW_CAPABILITIES.CONSENT_MANAGE
    ),

    // VRS checks
    canCreateClients: hasCapability(role, VRS_CAPABILITIES.CLIENTS_CREATE),
    canViewClients: hasCapability(role, VRS_CAPABILITIES.CLIENTS_VIEW),
    canUpdateClients: hasCapability(role, VRS_CAPABILITIES.CLIENTS_UPDATE),
    canDeleteClients: hasCapability(role, VRS_CAPABILITIES.CLIENTS_DELETE),
    canUseJobMatching: hasCapability(role, VRS_CAPABILITIES.JOB_MATCHING_USE),
    canManageEmployers: hasCapability(role, VRS_CAPABILITIES.EMPLOYERS_MANAGE),
    canViewRetentionAnalytics: hasCapability(
      role,
      VRS_CAPABILITIES.RETENTION_ANALYTICS_VIEW
    ),

    // Vendor checks
    canManageVendorServices: hasCapability(
      role,
      VENDOR_CAPABILITIES.SERVICES_MANAGE
    ),
    canManageLeads: hasCapability(role, VENDOR_CAPABILITIES.LEADS_MANAGE),
    canManageBookings: hasCapability(role, VENDOR_CAPABILITIES.BOOKINGS_MANAGE),
    canManageSponsorship: hasCapability(
      role,
      VENDOR_CAPABILITIES.SPONSORSHIP_MANAGE
    ),

    // System checks
    canManageSystem: hasCapability(role, SYSTEM_CAPABILITIES.SYSTEM_MANAGE),
    canManageUsers: hasCapability(role, SYSTEM_CAPABILITIES.USERS_MANAGE),
    canApproveProviders: hasCapability(
      role,
      SYSTEM_CAPABILITIES.PROVIDERS_APPROVE
    ),
    canVerifyLicenses: hasCapability(role, SYSTEM_CAPABILITIES.LICENSES_VERIFY),
    canViewAudit: hasCapability(role, SYSTEM_CAPABILITIES.AUDIT_VIEW),

    // Utility
    role,
    capabilities,
    user,
  };
}

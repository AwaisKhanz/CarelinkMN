import { UserRole } from "@carelink/types";

// ============================================
// PROVIDER PERMISSIONS
// ============================================
export const PROVIDER_PERMISSIONS = {
  DASHBOARD_VIEW: "provider:dashboard:view",
  PROFILE_MANAGE: "provider:profile:manage",
  HOMES_MANAGE: "provider:homes:manage",
  OPENINGS_MANAGE: "provider:openings:manage",
  SERVICES_MANAGE: "provider:services:manage",
  PLACEMENTS_MANAGE: "provider:placements:manage",
  LICENSES_MANAGE: "provider:licenses:manage",
  STAFF_MANAGE: "provider:staff:manage",
  BILLING_MANAGE: "provider:billing:manage",
  ANALYTICS_VIEW: "provider:analytics:view",
  REFERRALS_VIEW: "provider:referrals:view",
  REFERRALS_RESPOND: "provider:referrals:respond",
  MESSAGES_MANAGE: "provider:messages:manage",
  SETTINGS_MANAGE: "provider:settings:manage",
  RESIDENTS_VIEW: "provider:residents:view",
} as const;

// ============================================
// CASE MANAGER PERMISSIONS
// ============================================
export const CASE_MANAGER_PERMISSIONS = {
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
  PLACEMENTS_MANAGE: "case_manager:placements:manage",
  
} as const;

// ============================================
// HOSPITAL SOCIAL WORKER PERMISSIONS
// ============================================
export const HOSPITAL_SW_PERMISSIONS = {
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
// VRS SPECIALIST PERMISSIONS
// ============================================
export const VRS_PERMISSIONS = {
  DASHBOARD_VIEW: "vrs:dashboard:view",
  CLIENTS_CREATE: "vrs:clients:create",
  CLIENTS_VIEW: "vrs:clients:view",
  CLIENTS_UPDATE: "vrs:clients:update",
  CLIENTS_DELETE: "vrs:clients:delete",
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
// VENDOR PERMISSIONS
// ============================================
export const VENDOR_PERMISSIONS = {
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

// Define permissions for each role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    // System management
    "system:manage",
    "system:view",
    "system:delete",

    // User management
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "users:manage",

    // Organization management
    "organizations:create",
    "organizations:read",
    "organizations:update",
    "organizations:delete",
    "organizations:manage",

    // Provider management
    "providers:create",
    "providers:read",
    "providers:update",
    "providers:delete",
    "providers:manage",
    "providers:approve",
    "providers:verify",

    // Referral management
    "referrals:create",
    "referrals:read",
    "referrals:update",
    "referrals:delete",
    "referrals:manage",
    "referrals:assign",
    "referrals:track",

    // Analytics and reporting
    "analytics:view",
    "analytics:export",
    "analytics:system",

    // Audit and compliance
    "audit:view",
    "audit:export",
    "compliance:manage",

    // Communication
    "communications:send",
    "communications:manage",
    "notifications:send",
    "notifications:manage",
  ],

  [UserRole.ADMIN]: [
    // User management (limited)
    "users:read",
    "users:update",
    "users:manage",

    // Organization management
    "organizations:read",
    "organizations:update",
    "organizations:manage",

    // Provider management
    "providers:create",
    "providers:read",
    "providers:update",
    "providers:delete",
    "providers:manage",
    "providers:approve",
    "providers:verify",

    // Referral management
    "referrals:create",
    "referrals:read",
    "referrals:update",
    "referrals:delete",
    "referrals:manage",
    "referrals:assign",
    "referrals:track",

    // Analytics and reporting
    "analytics:view",
    "analytics:export",

    // Audit and compliance
    "audit:view",
    "compliance:view",

    // Communication
    "communications:send",
    "notifications:send",
  ],

  [UserRole.CASE_MANAGER]: [
    // Case Manager specific permissions
    ...Object.values(CASE_MANAGER_PERMISSIONS),

    // Legacy permissions for backward compatibility
    "providers:read",
    "referrals:create",
    "referrals:read",
    "referrals:update",
    "referrals:assign",
    "referrals:track",
    "analytics:own",
    "communications:send",
    "notifications:send",
  ],

  [UserRole.HOSPITAL_SW]: [
    // Hospital SW specific permissions
    ...Object.values(HOSPITAL_SW_PERMISSIONS),

    // Legacy permissions for backward compatibility
    "providers:read",
    "referrals:create",
    "referrals:read",
    "referrals:update",
    "referrals:assign",
    "referrals:track",
    "analytics:own",
    "communications:send",
    "notifications:send",
  ],

  [UserRole.VRS_SPECIALIST]: [
    // VRS specific permissions
    ...Object.values(VRS_PERMISSIONS),

    // Legacy permissions for backward compatibility
    "providers:read",
    "referrals:create",
    "referrals:read",
    "referrals:update",
    "referrals:assign",
    "referrals:track",
    "analytics:own",
    "communications:send",
    "notifications:send",
  ],

  [UserRole.PROVIDER_OWNER]: [
    "providers:read",
    "providers:update",
    "providers:manage",
    "referrals:read",
    "referrals:update",
    "referrals:track",
    "analytics:own",
    "communications:send",
    "notifications:send",
    ...Object.values(PROVIDER_PERMISSIONS),
  ],

  [UserRole.PROVIDER_STAFF]: [
    "providers:read",
    "referrals:read",
    "referrals:update",
    "referrals:track",
    "analytics:own",
    "communications:send",
    "notifications:send",
    PROVIDER_PERMISSIONS.DASHBOARD_VIEW,
    PROVIDER_PERMISSIONS.PROFILE_MANAGE,
    PROVIDER_PERMISSIONS.HOMES_MANAGE,
    PROVIDER_PERMISSIONS.OPENINGS_MANAGE,
    PROVIDER_PERMISSIONS.SERVICES_MANAGE,
    PROVIDER_PERMISSIONS.PLACEMENTS_MANAGE,
    PROVIDER_PERMISSIONS.LICENSES_MANAGE,
    PROVIDER_PERMISSIONS.ANALYTICS_VIEW,
    PROVIDER_PERMISSIONS.REFERRALS_VIEW,
    PROVIDER_PERMISSIONS.REFERRALS_RESPOND,
    PROVIDER_PERMISSIONS.MESSAGES_MANAGE,
    PROVIDER_PERMISSIONS.RESIDENTS_VIEW,
  ],

  [UserRole.VENDOR]: [
    // Vendor specific permissions
    ...Object.values(VENDOR_PERMISSIONS),

    // Legacy permissions for backward compatibility
    "providers:read",
    "referrals:read",
    "analytics:own",
    "communications:send",
    "notifications:send",
  ],

  [UserRole.PUBLIC]: [
    // No permissions
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(
  role: UserRole,
  permissions: string[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(
  role: UserRole,
  permissions: string[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if a role can access a specific resource
export function canAccessResource(
  role: UserRole,
  resource: string,
  action: string
): boolean {
  const permission = `${resource}:${action}`;
  return hasPermission(role, permission);
}

// Check if a role can manage another role
export function canManageRole(
  managerRole: UserRole,
  targetRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 10,
    [UserRole.ADMIN]: 9,
    [UserRole.CASE_MANAGER]: 8,
    [UserRole.HOSPITAL_SW]: 8,
    [UserRole.VRS_SPECIALIST]: 8,
    [UserRole.PROVIDER_OWNER]: 6,
    [UserRole.PROVIDER_STAFF]: 5,
    [UserRole.VENDOR]: 4,
    [UserRole.PUBLIC]: 1,
  };

  return roleHierarchy[managerRole] > roleHierarchy[targetRole];
}

// Check if a role can access PHI (Protected Health Information)
export function canAccessPHI(role: UserRole): boolean {
  const phiRoles = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.CASE_MANAGER,
    UserRole.HOSPITAL_SW,
    UserRole.VRS_SPECIALIST,
  ];

  return phiRoles.includes(role);
}

// Check if a role can create referrals
export function canCreateReferrals(role: UserRole): boolean {
  const referralRoles = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.CASE_MANAGER,
    UserRole.HOSPITAL_SW,
    UserRole.VRS_SPECIALIST,
  ];

  return referralRoles.includes(role);
}

// Check if a role can manage providers
export function canManageProviders(role: UserRole): boolean {
  const providerRoles = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PROVIDER_OWNER,
  ];

  return providerRoles.includes(role);
}

// Check if a role can view analytics
export function canViewAnalytics(role: UserRole): boolean {
  return (
    hasPermission(role, "analytics:view") ||
    hasPermission(role, "analytics:own")
  );
}

// Check if a role can export data
export function canExportData(role: UserRole): boolean {
  return hasPermission(role, "analytics:export");
}

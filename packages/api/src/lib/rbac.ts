import { UserRole } from "@carelink/types";

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
    // Provider management (read-only)
    "providers:read",
    
    // Referral management
    "referrals:create",
    "referrals:read",
    "referrals:update",
    "referrals:assign",
    "referrals:track",
    
    // Analytics (own data)
    "analytics:own",
    
    // Communication
    "communications:send",
    "notifications:send",
  ],
  
  [UserRole.HOSPITAL_SW]: [
    // Provider management (read-only)
    "providers:read",
    
    // Referral management
    "referrals:create",
    "referrals:read",
    "referrals:update",
    "referrals:assign",
    "referrals:track",
    
    // Analytics (own data)
    "analytics:own",
    
    // Communication
    "communications:send",
    "notifications:send",
  ],
  
  [UserRole.VRS_SPECIALIST]: [
    // Provider management (read-only)
    "providers:read",
    
    // Referral management
    "referrals:create",
    "referrals:read",
    "referrals:update",
    "referrals:assign",
    "referrals:track",
    
    // Analytics (own data)
    "analytics:own",
    
    // Communication
    "communications:send",
    "notifications:send",
  ],
  
  [UserRole.PROVIDER_OWNER]: [
    // Provider management (own)
    "providers:read",
    "providers:update",
    "providers:manage",
    
    // Referral management (received)
    "referrals:read",
    "referrals:update",
    "referrals:track",
    
    // Analytics (own data)
    "analytics:own",
    
    // Communication
    "communications:send",
    "notifications:send",
  ],
  
  [UserRole.PROVIDER_STAFF]: [
    // Provider management (limited)
    "providers:read",
    
    // Referral management (received)
    "referrals:read",
    "referrals:update",
    "referrals:track",
    
    // Analytics (own data)
    "analytics:own",
    
    // Communication
    "communications:send",
    "notifications:send",
  ],
  
  [UserRole.VENDOR]: [
    // Limited access
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
export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
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
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
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
  return hasPermission(role, "analytics:view") || hasPermission(role, "analytics:own");
}

// Check if a role can export data
export function canExportData(role: UserRole): boolean {
  return hasPermission(role, "analytics:export");
}

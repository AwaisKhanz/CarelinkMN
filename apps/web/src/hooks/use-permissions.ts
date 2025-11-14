"use client";

import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@carelink/types";

/**
 * Permission definitions matching backend RBAC system
 * These should match packages/api/src/lib/rbac.ts
 */
export const PERMISSIONS = {
  // Provider management
  PROVIDERS_READ: "providers:read",
  PROVIDERS_UPDATE: "providers:update",
  PROVIDERS_MANAGE: "providers:manage",

  // License management
  LICENSES_CREATE: "licenses:create",
  LICENSES_UPDATE: "licenses:update",
  LICENSES_DELETE: "licenses:delete",

  // Home management
  HOMES_CREATE: "homes:create",
  HOMES_UPDATE: "homes:update",
  HOMES_DELETE: "homes:delete",

  // Settings
  SETTINGS_MANAGE: "settings:manage",
  SUBSCRIPTION_MANAGE: "subscription:manage",

  // Staff management
  STAFF_MANAGE: "staff:manage",
} as const;

/**
 * Role-based permissions mapping
 * Matches backend RBAC system
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Super admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
  [UserRole.ADMIN]: [
    // Admin has most permissions
    ...Object.values(PERMISSIONS),
  ],
  [UserRole.PROVIDER_OWNER]: [
    PERMISSIONS.PROVIDERS_READ,
    PERMISSIONS.PROVIDERS_UPDATE,
    PERMISSIONS.PROVIDERS_MANAGE,
    PERMISSIONS.LICENSES_CREATE,
    PERMISSIONS.LICENSES_UPDATE,
    PERMISSIONS.LICENSES_DELETE,
    PERMISSIONS.HOMES_CREATE,
    PERMISSIONS.HOMES_UPDATE,
    PERMISSIONS.HOMES_DELETE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.SUBSCRIPTION_MANAGE,
    PERMISSIONS.STAFF_MANAGE,
  ],
  [UserRole.PROVIDER_STAFF]: [
    PERMISSIONS.PROVIDERS_READ,
    // Staff can read but not modify provider settings
    // Staff cannot manage licenses, homes, settings, or subscription
    // Staff cannot manage other staff
  ],
  [UserRole.CASE_MANAGER]: [],
  [UserRole.HOSPITAL_SW]: [],
  [UserRole.VRS_SPECIALIST]: [],
  [UserRole.VENDOR]: [],
  [UserRole.PUBLIC]: [],
};

/**
 * Hook to check user permissions
 *
 * @example
 * const { hasPermission, isOwner, isStaff } = usePermissions();
 * if (hasPermission(PERMISSIONS.LICENSES_CREATE)) {
 *   // Show create license button
 * }
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((permission) => hasPermission(permission));
  };

  /**
   * Check if user is a provider owner
   */
  const isOwner = user?.role === UserRole.PROVIDER_OWNER;

  /**
   * Check if user is provider staff
   */
  const isStaff = user?.role === UserRole.PROVIDER_STAFF;

  /**
   * Check if user is a provider user (owner or staff)
   */
  const isProviderUser =
    user?.role === UserRole.PROVIDER_OWNER ||
    user?.role === UserRole.PROVIDER_STAFF;

  /**
   * Check if user can manage provider settings
   */
  const canManageSettings = hasPermission(PERMISSIONS.SETTINGS_MANAGE);

  /**
   * Check if user can manage subscription
   */
  const canManageSubscription = hasPermission(PERMISSIONS.SUBSCRIPTION_MANAGE);

  /**
   * Check if user can manage licenses
   */
  const canManageLicenses =
    hasPermission(PERMISSIONS.LICENSES_CREATE) ||
    hasPermission(PERMISSIONS.LICENSES_UPDATE) ||
    hasPermission(PERMISSIONS.LICENSES_DELETE);

  /**
   * Check if user can manage homes
   */
  const canManageHomes =
    hasPermission(PERMISSIONS.HOMES_CREATE) ||
    hasPermission(PERMISSIONS.HOMES_UPDATE) ||
    hasPermission(PERMISSIONS.HOMES_DELETE);

  /**
   * Check if user can manage staff
   */
  const canManageStaff = hasPermission(PERMISSIONS.STAFF_MANAGE);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner,
    isStaff,
    isProviderUser,
    canManageSettings,
    canManageSubscription,
    canManageLicenses,
    canManageHomes,
    canManageStaff,
    userRole: user?.role,
  };
}

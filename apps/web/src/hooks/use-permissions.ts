"use client";

import { useAuth } from "@/contexts/auth-context";
import {
  PROVIDER_CAPABILITIES,
  ProviderCapability,
  getRoleCapabilities,
} from "@/lib/permissions/provider-capabilities";
import { UserRole } from "@carelink/types";

// Temporary alias until all imports migrate
export const PERMISSIONS = PROVIDER_CAPABILITIES;

/**
 * @deprecated This hook is provider-specific. For universal role permissions, use useRolePermissions from "./use-role-permissions"
 * This hook is kept for backward compatibility with existing provider dashboard code.
 */

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
  const roleCapabilities = getRoleCapabilities(user?.role);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: ProviderCapability): boolean => {
    if (!user) return false;
    return roleCapabilities.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: ProviderCapability[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: ProviderCapability[]): boolean => {
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
  const canManageSettings = hasPermission(
    PROVIDER_CAPABILITIES.SETTINGS_MANAGE
  );

  /**
   * Check if user can manage subscription
   */
  const canManageSubscription = hasPermission(
    PROVIDER_CAPABILITIES.BILLING_MANAGE
  );

  const canManageBilling = hasPermission(
    PROVIDER_CAPABILITIES.BILLING_MANAGE
  );

  /**
   * Check if user can manage licenses
   */
  const canManageLicenses = hasPermission(
    PROVIDER_CAPABILITIES.LICENSES_MANAGE
  );

  /**
   * Check if user can manage homes
   */
  const canManageHomes = hasPermission(PROVIDER_CAPABILITIES.HOMES_MANAGE);

  /**
   * Check if user can manage staff
   */
  const canManageStaff = hasPermission(PROVIDER_CAPABILITIES.STAFF_MANAGE);

  const canManageServices = hasPermission(
    PROVIDER_CAPABILITIES.SERVICES_MANAGE
  );

  const canManageOpenings = hasPermission(
    PROVIDER_CAPABILITIES.OPENINGS_MANAGE
  );

  const canManagePlacements = hasPermission(
    PROVIDER_CAPABILITIES.PLACEMENTS_MANAGE
  );

  const canManageMessages = hasPermission(
    PROVIDER_CAPABILITIES.MESSAGES_MANAGE
  );

  const canViewResidents = hasPermission(
    PROVIDER_CAPABILITIES.RESIDENTS_VIEW
  );

  const canViewAnalytics = hasPermission(
    PROVIDER_CAPABILITIES.ANALYTICS_VIEW
  );

  const canViewReferrals = hasPermission(
    PROVIDER_CAPABILITIES.REFERRALS_VIEW
  );

  const canRespondToReferrals = hasPermission(
    PROVIDER_CAPABILITIES.REFERRALS_RESPOND
  );

  const canManageProfile = hasPermission(
    PROVIDER_CAPABILITIES.PROFILE_MANAGE
  );

  const canViewDashboard = hasPermission(
    PROVIDER_CAPABILITIES.DASHBOARD_VIEW
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner,
    isStaff,
    isProviderUser,
    canManageSettings,
    canManageSubscription,
    canManageBilling,
    canManageLicenses,
    canManageHomes,
    canManageStaff,
    canManageServices,
    canManageOpenings,
    canManagePlacements,
    canManageMessages,
    canViewResidents,
    canViewAnalytics,
    canViewReferrals,
    canRespondToReferrals,
    canManageProfile,
    canViewDashboard,
    userRole: user?.role,
  };
}

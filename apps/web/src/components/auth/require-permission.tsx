"use client";

import { ReactNode, useMemo } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { AccessRestricted } from "@/components/provider/access-restricted";
import { ProviderCapability } from "@/lib/permissions/provider-capabilities";
import { Capability } from "@/lib/permissions/capabilities";

interface RequirePermissionProps {
  /**
   * Single permission to check (supports all capability types)
   */
  permission?: ProviderCapability | Capability;

  /**
   * Multiple permissions - user must have ANY of these (supports all capability types)
   */
  anyPermission?: (ProviderCapability | Capability)[];

  /**
   * Multiple permissions - user must have ALL of these (supports all capability types)
   */
  allPermissions?: (ProviderCapability | Capability)[];

  /**
   * Custom permission check function
   */
  check?: () => boolean;

  /**
   * Custom title for access restricted message
   */
  title?: string;

  /**
   * Custom description for access restricted message
   */
  description?: ReactNode;

  /**
   * Custom action button/link for access restricted message
   */
  action?: ReactNode;

  /**
   * Children to render if permission is granted
   */
  children: ReactNode;

  /**
   * Fallback component to render instead of AccessRestricted
   */
  fallback?: ReactNode;

  /**
   * Show loading state while checking permissions (optional)
   */
  showLoading?: boolean;
}

/**
 * Permission Guard Component
 *
 * Prevents children from rendering (and thus API calls) when user lacks required permissions.
 *
 * @example
 * // Single permission
 * <RequirePermission permission={PROVIDER_CAPABILITIES.HOMES_MANAGE}>
 *   <HomesPage />
 * </RequirePermission>
 *
 * @example
 * // Any of multiple permissions
 * <RequirePermission anyPermission={[PROVIDER_CAPABILITIES.HOMES_MANAGE, PROVIDER_CAPABILITIES.SERVICES_MANAGE]}>
 *   <HomeServicesPage />
 * </RequirePermission>
 *
 * @example
 * // Custom check
 * <RequirePermission check={() => canManageHomes || canManageServices}>
 *   <HomeServicesPage />
 * </RequirePermission>
 */
export function RequirePermission({
  permission,
  anyPermission,
  allPermissions,
  check,
  title,
  description,
  action,
  children,
  fallback,
  showLoading = false,
}: RequirePermissionProps) {
  const providerPermissions = usePermissions();
  const rolePermissions = useRolePermissions();

  // Determine if user has required permission
  const hasAccess = useMemo(() => {
    // Custom check function takes precedence
    if (check) {
      try {
        return check();
      } catch (error) {
        console.error("Error in permission check function:", error);
        return false;
      }
    }

    // Single permission check
    if (permission) {
      // Check if it's a provider capability (for backward compatibility)
      if (permission.startsWith("provider:")) {
        return providerPermissions.hasPermission(
          permission as ProviderCapability
        );
      }
      // Otherwise use role permissions which supports all capability types
      return rolePermissions.hasCapability(permission as Capability);
    }

    // Any of multiple permissions
    if (anyPermission && anyPermission.length > 0) {
      // Check if all are provider capabilities
      const allProviderCaps = anyPermission.every((cap) =>
        cap.startsWith("provider:")
      );
      if (allProviderCaps) {
        return providerPermissions.hasAnyPermission(
          anyPermission as ProviderCapability[]
        );
      }
      // Otherwise use role permissions
      return rolePermissions.hasAnyCapability(anyPermission as Capability[]);
    }

    // All of multiple permissions
    if (allPermissions && allPermissions.length > 0) {
      // Check if all are provider capabilities
      const allProviderCaps = allPermissions.every((cap) =>
        cap.startsWith("provider:")
      );
      if (allProviderCaps) {
        return providerPermissions.hasAllPermissions(
          allPermissions as ProviderCapability[]
        );
      }
      // Otherwise use role permissions
      return rolePermissions.hasAllCapabilities(allPermissions as Capability[]);
    }

    // If no permission check specified, deny access by default
    console.warn(
      "RequirePermission: No permission check specified. Denying access by default."
    );
    return false;
  }, [
    check,
    permission,
    anyPermission,
    allPermissions,
    providerPermissions,
    rolePermissions,
  ]);

  // Show loading state if requested
  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If access denied, show fallback or AccessRestricted
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AccessRestricted
        title={title}
        description={description}
        action={action}
      />
    );
  }

  // Access granted - render children
  // This prevents any API calls or effects in children from running
  return <>{children}</>;
}

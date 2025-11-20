/**
 * Admin utility functions
 * Shared utilities for admin-related operations
 */

import { UserStatus, LicenseStatus, OrganizationStatus } from "@carelink/types";
import type { BadgeProps } from "@/components/ui/badge";

/**
 * Get user status badge configuration
 */
export function getUserStatusBadgeConfig(status: UserStatus): {
  label: string;
  variant: BadgeProps["variant"];
} {
  const configs: Record<
    UserStatus,
    { label: string; variant: BadgeProps["variant"] }
  > = {
    [UserStatus.PENDING_VERIFICATION]: {
      label: "Pending Verification",
      variant: "outline",
    },
    [UserStatus.ACTIVE]: {
      label: "Active",
      variant: "default",
    },
    [UserStatus.SUSPENDED]: {
      label: "Suspended",
      variant: "destructive",
    },
    [UserStatus.DEACTIVATED]: {
      label: "Deactivated",
      variant: "secondary",
    },
  };

  return configs[status] || { label: status, variant: "outline" };
}

/**
 * Get license status badge configuration
 */
export function getLicenseStatusBadgeConfig(status: LicenseStatus): {
  label: string;
  variant: BadgeProps["variant"];
} {
  const configs: Record<
    LicenseStatus,
    { label: string; variant: BadgeProps["variant"] }
  > = {
    [LicenseStatus.PENDING]: {
      label: "Pending",
      variant: "outline",
    },
    [LicenseStatus.ACTIVE]: {
      label: "Approved",
      variant: "default",
    },
    [LicenseStatus.EXPIRED]: {
      label: "Rejected",
      variant: "destructive",
    },
    [LicenseStatus.SUSPENDED]: {
      label: "Suspended",
      variant: "destructive",
    },
    [LicenseStatus.REVOKED]: {
      label: "Revoked",
      variant: "destructive",
    },
  };

  return configs[status] || { label: status, variant: "outline" };
}

/**
 * Get organization status badge configuration
 */
export function getOrganizationStatusBadgeConfig(status: OrganizationStatus): {
  label: string;
  variant: BadgeProps["variant"];
} {
  const configs: Record<
    OrganizationStatus,
    { label: string; variant: BadgeProps["variant"] }
  > = {
    [OrganizationStatus.PENDING]: {
      label: "Pending",
      variant: "outline",
    },
    [OrganizationStatus.VERIFIED]: {
      label: "Verified",
      variant: "default",
    },
    [OrganizationStatus.SUSPENDED]: {
      label: "Suspended",
      variant: "destructive",
    },
    [OrganizationStatus.DEACTIVATED]: {
      label: "Deactivated",
      variant: "secondary",
    },
  };

  return configs[status] || { label: status, variant: "outline" };
}

/**
 * Format user display name
 */
export function getUserDisplayName(user: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): string {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user?.email || "Unknown User";
}

/**
 * Format organization display name
 */
export function getOrganizationDisplayName(org: {
  name?: string;
  id?: string;
}): string {
  return org?.name || `Organization ${org?.id?.slice(0, 8) || "Unknown"}`;
}

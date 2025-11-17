"use client";

/**
 * Re-export provider capabilities and related functions from the comprehensive capabilities module.
 * This maintains backward compatibility while using the new unified permission system.
 */
export {
  PROVIDER_CAPABILITIES,
  type ProviderCapability,
  hasCapability,
  hasAnyCapability,
  hasAllCapabilities,
} from "./capabilities";

// Re-export for backward compatibility
import { ROLE_CAPABILITIES, PROVIDER_CAPABILITIES } from "./capabilities";
import { UserRole } from "@carelink/types";
import { ProviderCapability } from "./capabilities";

/**
 * Get provider capabilities for a role (filters to only provider capabilities).
 * This is used by the usePermissions hook for backward compatibility.
 */
export function getRoleCapabilities(
  role?: UserRole | null
): ProviderCapability[] {
  if (!role) return [];
  const allCapabilities = ROLE_CAPABILITIES[role] || [];
  // Filter to only provider capabilities for backward compatibility
  return allCapabilities.filter((cap) =>
    cap.startsWith("provider:")
  ) as ProviderCapability[];
}

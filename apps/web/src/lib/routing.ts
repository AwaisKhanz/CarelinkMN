import { UserRole } from "@carelink/types";

/**
 * Get the dashboard path based on user role
 */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      return "/admin/dashboard";

    case UserRole.PROVIDER_OWNER:
    case UserRole.PROVIDER_STAFF:
      return "/provider/dashboard";

    case UserRole.CASE_MANAGER:
      return "/case-manager/dashboard";

    case UserRole.HOSPITAL_SW:
      return "/hospital-sw/dashboard";

    case UserRole.VRS_SPECIALIST:
      return "/vrs/dashboard";

    case UserRole.VENDOR:
      return "/vendor/dashboard";

    case UserRole.PUBLIC:
    default:
      return "/search"; // Public users go to search page
  }
}

/**
 * Get the app root path based on user role
 */
export function getAppPath(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      return "/admin";

    case UserRole.PROVIDER_OWNER:
    case UserRole.PROVIDER_STAFF:
      return "/provider";

    case UserRole.CASE_MANAGER:
      return "/case-manager";

    case UserRole.HOSPITAL_SW:
      return "/hospital-sw";

    case UserRole.VRS_SPECIALIST:
      return "/vrs";

    case UserRole.VENDOR:
      return "/vendor";

    case UserRole.PUBLIC:
    default:
      return "/app";
  }
}

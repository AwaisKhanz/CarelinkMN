/**
 * Returns true if a service with the given allowed license types
 * is allowed for a provider that holds the given provider license types.
 * Empty service licenseTypes means no restriction.
 * 
 * Handles license type mapping:
 * - 245D_BASIC and 245D_INTENSIVE match 245D
 * - This ensures consistency between license types and service requirements
 */
export function isServiceAllowedForProvider(
  serviceLicenseTypes: string[] | null | undefined,
  providerLicenseTypes: string[] | null | undefined
): boolean {
  if (!serviceLicenseTypes || serviceLicenseTypes.length === 0) return true;
  if (!providerLicenseTypes || providerLicenseTypes.length === 0) return false;
  const providerSet = new Set(providerLicenseTypes);
  
  return serviceLicenseTypes.some((serviceLicenseType) => {
    // Direct match
    if (providerSet.has(serviceLicenseType)) {
      return true;
    }
    // Special handling: 245D_BASIC and 245D_INTENSIVE match 245D
    if (serviceLicenseType === "245D") {
      return (
        providerSet.has("245D_BASIC") ||
        providerSet.has("245D_INTENSIVE")
      );
    }
    // Reverse: if service requires 245D_BASIC or 245D_INTENSIVE, and provider has 245D
    if (
      (serviceLicenseType === "245D_BASIC" ||
        serviceLicenseType === "245D_INTENSIVE") &&
      providerSet.has("245D")
    ) {
      return true;
    }
    return false;
  });
}



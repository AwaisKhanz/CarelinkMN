/**
 * API Response Validation Utilities
 * Validates API responses against expected schemas to ensure type safety
 */

import { z } from "zod";
import {
  SubscriptionTier,
  License,
  LicenseStatus,
  ApiResponse,
} from "@carelink/types";
import type { Provider } from "@/lib/api";

/**
 * Provider response schema
 */
export const ProviderSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  primaryLicenseTypeId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  logo: z.string().url().nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  acceptsReferrals: z.boolean(),
  responseTimeHours: z.number().int().positive().nullable().optional(),
  verified: z.boolean().optional(),
  verifiedAt: z.string().datetime().nullable().optional(),
  verificationNotes: z.string().nullable().optional(),
  subscriptionTier: z.nativeEnum(SubscriptionTier).optional(),
  subscriptionId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  organization: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      type: z.string(),
      email: z.string().email(),
      phone: z.string(),
      city: z.string(),
      state: z.string(),
      county: z.string(),
      addressLine1: z.string(),
      addressLine2: z.string().nullable().optional(),
      zipCode: z.string(),
      website: z.string().url().or(z.literal('')).nullable().optional(),
    })
    .optional(),
  licenses: z.array(z.any()).optional(),
  homes: z.array(z.any()).optional(),
});

/**
 * License response schema
 */
export const LicenseSchema = z.object({
  id: z.string().uuid(),
  providerId: z.string().uuid(),
  licenseTypeId: z.string(),
  licenseNumber: z.string(),
  issueDate: z.string().datetime(),
  expirationDate: z.string().datetime(),
  status: z.nativeEnum(LicenseStatus),
  verifiedAt: z.string().datetime().nullable().optional(),
  verifiedBy: z.string().nullable().optional(),
  documentUrl: z.string().url().nullable().optional(),
  fileName: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  licenseType: z.object({ name: z.string() }).optional(), // Optional relation
});

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative(),
});

/**
 * Generic API response validator
 */
export function validateApiResponse<T>(
  response: unknown,
  schema: z.ZodSchema<T>,
  errorMessage = "Invalid API response"
): T {
  try {
    return schema.parse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`${errorMessage}:`, error.errors);
      throw new Error(
        `${errorMessage}: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
}

/**
 * Validate API response wrapper
 */
export function validateApiResponseWrapper<T>(
  response: ApiResponse<T>,
  schema: z.ZodSchema<T>,
  errorMessage = "Invalid API response"
): T {
  if (!response.success) {
    throw new Error(response.error || response.message || "API request failed");
  }

  if (!response.data) {
    throw new Error("API response missing data");
  }

  return validateApiResponse(response.data, schema, errorMessage);
}

/**
 * Safe API response validator (returns null on validation failure instead of throwing)
 */
export function safeValidateApiResponse<T>(
  response: unknown,
  schema: z.ZodSchema<T>
): T | null {
  try {
    return schema.parse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn("API response validation failed:", error.errors);
      return null;
    }
    return null;
  }
}

/**
 * Transform null to undefined for optional fields
 */
function transformNullToUndefined<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj } as any;
  for (const key in result) {
    if (
      result[key] === null &&
      (key.includes("At") ||
        key.includes("By") ||
        key === "description" ||
        key === "logo" ||
        key === "coverImage")
    ) {
      result[key] = undefined;
    }
  }
  return result as T;
}

/**
 * Validate provider response
 */
export function validateProviderResponse(response: unknown): Provider {
  const validated = validateApiResponse(
    response,
    ProviderSchema,
    "Invalid provider response"
  );
  // Transform null to undefined for compatibility
  return transformNullToUndefined(validated) as Provider;
}

/**
 * Validate license response
 */
export function validateLicenseResponse(response: unknown): License {
  const validated = validateApiResponse(
    response,
    LicenseSchema,
    "Invalid license response"
  );
  // Transform null to undefined for compatibility
  const transformed = transformNullToUndefined(validated);
  return {
    ...transformed,
    verifiedAt: transformed.verifiedAt ?? undefined,
    verifiedBy: transformed.verifiedBy ?? undefined,
  } as License;
}

/**
 * Validate array of licenses
 */
export function validateLicensesResponse(response: unknown): License[] {
  const schema = z.array(LicenseSchema);
  const validated = validateApiResponse(
    response,
    schema,
    "Invalid licenses response"
  );
  // Transform null to undefined for compatibility
  return validated.map((license) => {
    const transformed = transformNullToUndefined(license);
    return {
      ...transformed,
      verifiedAt: transformed.verifiedAt ?? undefined,
      verifiedBy: transformed.verifiedBy ?? undefined,
    } as License;
  });
}

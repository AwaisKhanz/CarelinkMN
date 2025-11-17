import { z } from "zod";

// Provider creation schema
export const CreateProviderSchema = z.object({
  organizationId: z.string().uuid("Valid organization ID is required"),
  primaryLicenseType: z.string().min(1, "Primary license type is required"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  logo: z.string().url("Logo must be a valid URL").optional(),
  coverImage: z.string().url("Cover image must be a valid URL").optional(),
  acceptsReferrals: z.boolean().optional().default(true),
  responseTimeHours: z.number().int().min(1).max(168, "Response time must be between 1 and 168 hours").optional(),
});

export type CreateProviderRequest = z.infer<typeof CreateProviderSchema>;

// Provider update schema
export const UpdateProviderSchema = z.object({
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  logo: z.string().url("Logo must be a valid URL").optional(),
  coverImage: z.string().url("Cover image must be a valid URL").optional(),
  acceptsReferrals: z.boolean().optional(),
  responseTimeHours: z.number().int().min(1).max(168, "Response time must be between 1 and 168 hours").optional(),
  verified: z.boolean().optional(),
  verificationNotes: z.string().max(1000, "Verification notes must be less than 1000 characters").optional(),
});

export type UpdateProviderRequest = z.infer<typeof UpdateProviderSchema>;

// License creation schema
export const CreateLicenseSchema = z.object({
  licenseType: z.string().min(1, "License type is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  issueDate: z.string().datetime("Valid issue date is required"),
  expirationDate: z.string().datetime("Valid expiration date is required"),
  documentUrl: z.string().url("Document URL must be a valid URL"),
});

export type CreateLicenseRequest = z.infer<typeof CreateLicenseSchema>;

// License verification schema
export const VerifyLicenseSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "EXPIRED", "SUSPENDED", "REJECTED"], {
    errorMap: () => ({ message: "Invalid license status" }),
  }),
  verificationNotes: z.string().max(1000, "Verification notes must be less than 1000 characters").optional(),
});

export type VerifyLicenseRequest = z.infer<typeof VerifyLicenseSchema>;

// Provider query parameters
export const ProviderQuerySchema = z.object({
  includeHomes: z.string().optional().transform(val => val === 'true'),
  includeServices: z.string().optional().transform(val => val === 'true'),
  includeOpenings: z.string().optional().transform(val => val === 'true'),
});

export type ProviderQueryParams = z.infer<typeof ProviderQuerySchema>;

// License query parameters
export const LicenseQuerySchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "EXPIRED", "SUSPENDED", "REJECTED"]).optional(),
});

export type LicenseQueryParams = z.infer<typeof LicenseQuerySchema>;

// Provider search filters
export const ProviderSearchSchema = z.object({
  search: z.string().optional(),
  verified: z.string().optional().transform(val => val === 'true'),
  subscriptionTier: z.string().optional(),
  organizationType: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
});

export type ProviderSearchParams = z.infer<typeof ProviderSearchSchema>;

// License status enum
export enum LicenseStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  SUSPENDED = "SUSPENDED",
  REJECTED = "REJECTED",
}

// Provider subscription tiers
export enum SubscriptionTier {
  FREE = "FREE",
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
  ENTERPRISE = "ENTERPRISE",
}

// License types (Minnesota specific)
export const LICENSE_TYPES = [
  "144D", // Assisted Living - Dementia Care
  "245D_BASIC", // 245D Basic
  "245D_INTENSIVE", // 245D Intensive
  "CRS", // Community Residential Services
  "ALF", // Assisted Living Facility
  "ICF_DD", // Intermediate Care Facility for DD
  "SIL", // Semi-Independent Living
] as const;

export type LicenseType = typeof LICENSE_TYPES[number];

// Provider statistics
export interface ProviderStats {
  totalHomes: number;
  activeHomes: number;
  totalOpenings: number;
  activeOpenings: number;
  totalPlacements: number;
  recentPlacements: number;
  occupancyRate: number;
}

// License statistics
export interface LicenseStats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  suspended: number;
  rejected: number;
  expiringSoon: number;
}

// License validation result
export interface LicenseValidationResult {
  valid: boolean;
  status?: string;
  expirationDate?: Date;
  details?: {
    licenseType?: string;
    facilityName?: string;
    address?: string;
    error?: string;
  };
}

// Provider public profile (optimized for search results)
export interface ProviderPublicProfile {
  id: string;
  primaryLicenseType: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  acceptsReferrals: boolean;
  responseTimeHours?: number;
  verified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    type: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    county?: string;
    phone?: string;
    website?: string;
  };
  licenses: Array<{
    licenseType: string;
    licenseNumber: string;
    expirationDate: Date;
  }>;
  homes: Array<{
    id: string;
    name: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    county?: string;
    capacity: number;
    currentOccupancy: number;
    wheelchairAccessible: boolean;
    singleLevel: boolean;
    hasElevator: boolean;
    hasRollInShower: boolean;
    acceptingNew: boolean;
    photos: Array<{
      url: string;
      caption?: string;
    }>;
    services: Array<{
      service: {
        id: string;
        name: string;
        description?: string;
        category: string;
      };
      notes?: string;
    }>;
    amenities: Array<{
      amenityType: string;
      description?: string;
    }>;
  }>;
}

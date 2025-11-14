import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^\+?1?\d{10,14}$/, 'Invalid phone number');
export const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code');
export const uuidSchema = z.string().uuid('Invalid UUID');

// Minnesota-specific validations
export const minnesotaCountySchema = z.enum([
  'Hennepin', 'Ramsey', 'Dakota', 'Anoka', 'Washington', 'Carver', 'Scott', 'Wright', 'Sherburne', 'Stearns'
  // Add all 87 counties
]);

export const payerSchema = z.enum(['MA', 'MEDICARE', 'PRIVATE', 'CADI', 'BI_TBI', 'EW', 'DD']);
export const licenseTypeSchema = z.enum(['144D', '245D_BASIC', '245D_INTENSIVE', 'CRS', 'ALF', 'ICF_DD', 'SIL']);

// Search validation
export const searchFiltersSchema = z.object({
  county: z.string().optional(),
  city: z.string().optional(),
  zipCode: zipCodeSchema.optional(),
  radius: z.number().min(1).max(100).optional(),
  licenseTypes: z.array(licenseTypeSchema).optional(),
  services: z.array(z.string()).optional(),
  payers: z.array(payerSchema).optional(),
  wheelchairAccessible: z.boolean().optional(),
  singleLevel: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  hasRollInShower: z.boolean().optional(),
  openOnly: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['relevance', 'distance', 'rating', 'availability']).default('relevance'),
});

// User validation
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: phoneSchema.optional(),
  role: z.enum(['PROVIDER_OWNER', 'CASE_MANAGER', 'HOSPITAL_SW', 'PUBLIC']),
  organizationId: uuidSchema.optional(),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Provider validation
export const providerCreateSchema = z.object({
  organizationId: uuidSchema,
  primaryLicenseType: licenseTypeSchema,
  description: z.string().max(2000).optional(),
  logo: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  acceptsReferrals: z.boolean().default(true),
  responseTimeHours: z.number().min(1).max(168).optional(),
});

// Opening validation
export const openingCreateSchema = z.object({
  homeId: uuidSchema,
  spotsAvailable: z.number().min(1).max(100),
  availableFrom: z.date(),
  availableUntil: z.date().optional(),
  ageMin: z.number().min(0).max(150).optional(),
  ageMax: z.number().min(0).max(150).optional(),
  genderPreference: z.enum(['MALE', 'FEMALE', 'OTHER', 'NO_PREFERENCE']).optional(),
  careLevels: z.array(z.string()),
  supportedNeeds: z.array(z.string()),
  acceptedPayers: z.array(payerSchema),
  privatePayRate: z.number().min(0).optional(),
});

// Referral validation
export const referralCreateSchema = z.object({
  caseManagerId: uuidSchema,
  organizationId: uuidSchema,
  clientAge: z.number().min(0).max(150),
  clientGender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NO_PREFERENCE']),
  clientInitials: z.string().min(1).max(10),
  careLevels: z.array(z.string()),
  servicesNeeded: z.array(z.string()),
  mobilityLevel: z.string().optional(),
  behavioralNeeds: z.array(z.string()),
  medicalNeeds: z.array(z.string()),
  preferredCounties: z.array(z.string()),
  preferredCities: z.array(z.string()),
  maxDistance: z.number().min(1).max(500).optional(),
  primaryPayer: payerSchema,
  secondaryPayer: payerSchema.optional(),
  targetMoveDate: z.date().optional(),
  urgency: z.enum(['URGENT', 'HIGH', 'ROUTINE']).default('ROUTINE'),
  internalNotes: z.string().max(5000).optional(),
});

// Utility functions
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

export function validateZipCode(zipCode: string): boolean {
  return zipCodeSchema.safeParse(zipCode).success;
}

export function validateUUID(uuid: string): boolean {
  return uuidSchema.safeParse(uuid).success;
}

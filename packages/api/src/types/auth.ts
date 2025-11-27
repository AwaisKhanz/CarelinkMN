import { z } from "zod";
import { UserRole, OrganizationType } from "@carelink/types";

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface OrganizationRegistrationData {
  name: string;
  type: OrganizationType;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  ein?: string;
  npi?: string;
  website?: string;
  fax?: string;
}

export interface OrganizationSelectionData {
  organizationId: string;
}

export interface RoleSpecificRegistrationData {
  // Provider fields
  primaryLicenseType?: string;
  description?: string;
  // Case Manager fields
  licenseNumber?: string;
  licenseExpiry?: string;
  // Hospital Staff fields
  department?: string;
  title?: string;
  // Vendor fields
  category?: string;
  businessName?: string;
  services?: string[];
  serviceAreas?: string[];
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId?: string;
    organization?: {
      id: string;
      name: string;
      type: string;
    };
  };
  token: string;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}


export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Validation schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const OrganizationRegistrationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  type: z.nativeEnum(OrganizationType, {
    errorMap: () => ({ message: "Please select a valid organization type" }),
  }),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "Please enter a valid state code (e.g., MN)"),
  zipCode: z.string().min(5, "Please enter a valid zip code"),
  county: z.string().min(1, "County is required"),
  ein: z.string().optional(),
  npi: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  fax: z.string().optional(),
});

export const RoleSpecificRegistrationSchema = z.object({
  // Provider fields
  primaryLicenseType: z.string().optional(),
  description: z.string().optional(),
  // Case Manager fields
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  // Hospital Staff fields
  department: z.string().optional(),
  title: z.string().optional(),
  // Vendor fields
  category: z.string().optional(),
  businessName: z.string().optional(),
  services: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  iat: number;
  exp: number;
}

// Session types
export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
  organizationId?: string;
  profileImage?: string;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user: SessionUser;
}

import { db } from "@carelink/database";
import { UserRole } from "@carelink/types";
import {
  OrganizationType,
  OrganizationStatus,
  SubscriptionTier,
  SubscriptionStatus,
  ProductType,
  EventType,
  AuditResult,
  OnboardingReviewStatus,
  PrismaClient,
  Prisma,
  VendorCategory,
} from "@prisma/client";
import { UserStatus } from "@carelink/types";
import { RegisterRequest } from "../types/auth";

// Transaction type
type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
import { hashPassword, validatePasswordStrength } from "../lib/password";
import { generateToken } from "../lib/jwt";

export interface OrganizationData {
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

export interface RoleSpecificData {
  // Provider-specific
  primaryLicenseType?: string;
  description?: string;

  // Case Manager-specific
  licenseNumber?: string;
  licenseExpiry?: string;

  // Hospital Staff-specific
  department?: string;
  title?: string;

  // VRS Specialist-specific
  // (No additional fields needed)

  // Vendor-specific
  category?: string;
  subcategories?: string[];
  businessName?: string;
  services?: string[];
  serviceAreas?: string[];
}

export interface OrganizationSelectionData {
  organizationId: string;
}

export class RegistrationService {
  /**
   * Simplified registration process - only creates user account
   */
  async registerUser(
    userData: RegisterRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: Prisma.UserGetPayload<{}>;
    token: string;
  }> {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(
        `Password validation failed: ${passwordValidation.errors.join(", ")}`
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          status: UserStatus.PENDING_VERIFICATION,
        },
      });

      // 2. Create Organization and role-specific records based on role
      const requiredOrgType = this.getRequiredOrganizationType(userData.role);

      if (requiredOrgType) {
        // Create a placeholder organization (will be updated during onboarding/configuration)
        // Required fields use placeholder values that will be updated during onboarding
        const organization = await tx.organization.create({
          data: {
            name: this.getPlaceholderOrganizationName(
              userData.role,
              userData.firstName,
              userData.lastName
            ),
            type: requiredOrgType,
            email: userData.email,
            phone: userData.phone || "Phone to be provided", // Required field, use placeholder
            // Required address fields - use placeholders that will be updated during onboarding
            addressLine1: "Address to be provided",
            city: "City to be provided",
            state: "MN", // Default to Minnesota as per PRD (CareLinkMN is Minnesota-focused)
            zipCode: "00000", // Placeholder ZIP - will be updated during onboarding
            county: "County to be provided",
            status: OrganizationStatus.PENDING,
            // Don't set ein/npi - will be set during onboarding/configuration
            // This avoids unique constraint issues with unique fields
          },
        });

        // Link user to organization
        await tx.user.update({
          where: { id: user.id },
          data: { organizationId: organization.id },
        });

        // Create role-specific records
        await this.createRoleSpecificRecord(
          tx,
          user.id,
          userData.role,
          {}, // Empty data - will be filled during onboarding/configuration
          organization.id,
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.phone
        );

        // For providers, create ProviderOnboardingState immediately
        // This ensures onboarding state exists right after registration
        if (
          userData.role === UserRole.PROVIDER_OWNER ||
          userData.role === UserRole.PROVIDER_STAFF
        ) {
          const provider = await tx.provider.findFirst({
            where: { organizationId: organization.id },
          });
          if (provider) {
            await tx.providerOnboardingState.create({
              data: {
                providerId: provider.id,
                currentStep: 0,
                completedSteps: [],
                organizationData: {},
                licenseData: {},
                serviceData: {},
                subscriptionData: {},
                isComplete: false,
                adminReviewStatus: OnboardingReviewStatus.PENDING,
              },
            });
          }
        }
      }

      // 3. Create Analytics Event
      await this.logRegistrationEvent(tx, user.id, user.role as UserRole, {
        ipAddress,
        userAgent,
      });

      // 4. Create Audit Log
      await this.logAuditEvent(
        tx,
        user.id,
        "user.register",
        "User",
        user.id,
        {
          role: user.role,
          email: user.email,
        },
        ipAddress,
        userAgent,
        AuditResult.SUCCESS
      );

      // Fetch user with organization
      const userWithOrg = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          organization: true,
        },
      });

      return { user: userWithOrg || user };
    });

    // 4. Generate token
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role as UserRole,
    });

    return {
      user: result.user,
      token,
    };
  }

  /**
   * Create organization based on role requirements
   */
  private async createOrganization(
    tx: TransactionClient,
    data: OrganizationData
  ) {
    return await tx.organization.create({
      data: {
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        county: data.county,
        ein: data.ein,
        npi: data.npi,
        website: data.website,
        fax: data.fax,
        status: OrganizationStatus.PENDING,
      },
    });
  }

  /**
   * Get existing organization by ID
   */
  private async getExistingOrganization(
    tx: TransactionClient,
    organizationId: string
  ) {
    const organization = await tx.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    if (organization.status !== OrganizationStatus.VERIFIED) {
      throw new Error(
        "Organization is not verified and cannot accept new members"
      );
    }

    return organization;
  }

  /**
   * Create role-specific database records
   */
  private async createRoleSpecificRecord(
    tx: TransactionClient,
    userId: string,
    role: UserRole,
    data: RoleSpecificData,
    organizationId?: string,
    userEmail?: string,
    userFirstName?: string,
    userLastName?: string,
    userPhone?: string
  ) {
    switch (role) {
      case UserRole.PROVIDER_OWNER:
      case UserRole.PROVIDER_STAFF:
        if (!organizationId) {
          throw new Error("Organization ID required for provider roles");
        }
        return await this.createProvider(tx, organizationId, data);

      case UserRole.CASE_MANAGER:
        if (!organizationId) {
          throw new Error("Organization ID required for case manager role");
        }
        return await this.createCaseManager(
          tx,
          organizationId,
          userId,
          data,
          userEmail!,
          userFirstName!,
          userLastName!,
          userPhone
        );

      case UserRole.HOSPITAL_SW:
        if (!organizationId) {
          throw new Error("Organization ID required for hospital staff role");
        }
        return await this.createHospitalStaff(
          tx,
          organizationId,
          userId,
          data,
          userEmail!,
          userFirstName!,
          userLastName!,
          userPhone
        );

      case UserRole.VRS_SPECIALIST:
        // VRS specialists don't need additional records beyond User
        return null;

      case UserRole.VENDOR:
        if (!organizationId) {
          throw new Error("Organization ID required for vendor role");
        }
        return await this.createVendor(tx, organizationId, data);

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
      case UserRole.PUBLIC:
        // These roles don't need additional records
        return null;

      default:
        throw new Error(`Unsupported role: ${role}`);
    }
  }

  /**
   * Create Provider record
   */
  private async createProvider(
    tx: TransactionClient,
    organizationId: string,
    data: RoleSpecificData
  ) {
    const provider = await tx.provider.create({
      data: {
        organizationId,
        // primaryLicenseTypeId will be set during onboarding
        description: data.description || "",
        subscriptionTier: SubscriptionTier.FREE,
        verified: false,
        acceptsReferrals: true,
      },
    });

    // Note: Subscription records are created when users upgrade via Stripe checkout
    // FREE tier providers don't need a Subscription record - tier is tracked on Provider model

    return provider;
  }

  /**
   * Create Case Manager record
   */
  private async createCaseManager(
    tx: TransactionClient,
    organizationId: string,
    userId: string,
    data: RoleSpecificData,
    userEmail: string,
    userFirstName: string,
    userLastName: string,
    userPhone?: string
  ) {
    return await tx.caseManager.create({
      data: {
        organizationId,
        firstName: userFirstName,
        lastName: userLastName,
        email: userEmail,
        phone: userPhone,
        licenseNumber: data.licenseNumber || null, // Will be updated during configuration
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
        isActive: true,
      },
    });
  }

  /**
   * Create Hospital Staff record
   */
  private async createHospitalStaff(
    tx: TransactionClient,
    organizationId: string,
    userId: string,
    data: RoleSpecificData,
    userEmail: string,
    userFirstName: string,
    userLastName: string,
    userPhone?: string
  ) {
    return await tx.hospitalStaff.create({
      data: {
        organizationId,
        firstName: userFirstName,
        lastName: userLastName,
        email: userEmail,
        phone: userPhone,
        department: data.department || null, // Will be updated during configuration
        title: data.title || null,
        isActive: true,
      },
    });
  }

  /**
   * Create Vendor record
   */
  private async createVendor(
    tx: TransactionClient,
    organizationId: string,
    data: RoleSpecificData
  ) {
    return await tx.vendor.create({
      data: {
        organizationId,
        category: (data.category as VendorCategory) || VendorCategory.TRAINING,
        subcategories: data.subcategories || [],
        businessName: data.businessName || "",
        description: "",
        services: data.services || [],
        serviceAreas: data.serviceAreas || [],
        isSponsoredVendor: false,
        isVerified: false,
      },
    });
  }

  /**
   * Create default subscription for provider
   * NOTE: This is deprecated - subscriptions are now created via Stripe checkout
   * FREE tier providers don't need Subscription records
   */
  private async createProviderSubscription(
    tx: TransactionClient,
    organizationId: string
  ) {
    // Subscriptions are created when users upgrade via Stripe checkout
    // FREE tier is tracked via Provider.subscriptionTier field
    // This method is kept for backward compatibility but not called
    return null;
  }

  /**
   * Log registration analytics event
   */
  private async logRegistrationEvent(
    tx: TransactionClient,
    userId: string,
    role: UserRole,
    metadata: Record<string, any>
  ) {
    return await tx.analyticsEvent.create({
      data: {
        eventType: EventType.USER_REGISTERED,
        userId,
        eventData: {
          role,
          registrationMethod: "web",
          ...metadata,
        },
        ipAddress: metadata.ipAddress as string,
        userAgent: metadata.userAgent as string,
      },
    });
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    tx: TransactionClient,
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    result: AuditResult = AuditResult.SUCCESS
  ) {
    return await tx.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        metadata,
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        result,
      },
    });
  }

  /**
   * Get required organization type for a role
   * Based on schema.prisma: roles that need Organization + role-specific records
   */
  getRequiredOrganizationType(role: UserRole): OrganizationType | null {
    switch (role) {
      case UserRole.PROVIDER_OWNER:
      case UserRole.PROVIDER_STAFF:
        return OrganizationType.PROVIDER;
      case UserRole.CASE_MANAGER:
        return OrganizationType.CASE_MANAGEMENT;
      case UserRole.HOSPITAL_SW:
        return OrganizationType.HOSPITAL;
      case UserRole.VENDOR:
        return OrganizationType.VENDOR;
      case UserRole.VRS_SPECIALIST:
        // VRS specialists work independently - no organization needed per schema
        return null;
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
      case UserRole.PUBLIC:
        return null; // No organization required
      default:
        throw new Error(`Unsupported role: ${role}`);
    }
  }

  /**
   * Get placeholder organization name based on role
   */
  private getPlaceholderOrganizationName(
    role: UserRole,
    firstName: string,
    lastName: string
  ): string {
    switch (role) {
      case UserRole.PROVIDER_OWNER:
      case UserRole.PROVIDER_STAFF:
        return `${firstName} ${lastName} - Provider (Pending Setup)`;
      case UserRole.CASE_MANAGER:
        return `${firstName} ${lastName} - Case Management (Pending Setup)`;
      case UserRole.HOSPITAL_SW:
        return `${firstName} ${lastName} - Hospital (Pending Setup)`;
      case UserRole.VENDOR:
        return `${firstName} ${lastName} - Vendor (Pending Setup)`;
      case UserRole.VRS_SPECIALIST:
        // VRS specialists don't need organizations
        return `${firstName} ${lastName} - Organization (Pending Setup)`;
      default:
        return `${firstName} ${lastName} - Organization (Pending Setup)`;
    }
  }

  /**
   * Validate role-specific data
   * Note: During registration, we don't require all fields - they can be filled during onboarding/configuration
   */
  validateRoleSpecificData(
    role: UserRole,
    data: RoleSpecificData
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation is lenient during registration - fields can be filled later
    // This allows users to register quickly and complete their profile later

    switch (role) {
      case UserRole.PROVIDER_OWNER:
      case UserRole.PROVIDER_STAFF:
      case UserRole.CASE_MANAGER:
      case UserRole.HOSPITAL_SW:
      case UserRole.VENDOR:
      case UserRole.VRS_SPECIALIST:
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
      case UserRole.PUBLIC:
        // No strict validation during registration
        // All required fields will be validated during onboarding/configuration
        break;

      default:
        errors.push(`Unsupported role: ${role}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

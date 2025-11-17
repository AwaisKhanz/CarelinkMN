import {
  PrismaClient,
  ProviderOnboardingState,
  OnboardingReviewStatus,
  Prisma,
} from "@carelink/database";

export interface OnboardingStepData {
  step: number;
  data: Prisma.JsonValue;
  isComplete?: boolean;
}

export interface OnboardingState {
  id: string;
  providerId: string;
  currentStep: number;
  completedSteps: number[];
  organizationData?: Prisma.JsonValue;
  licenseData?: Prisma.JsonValue;
  serviceData?: Prisma.JsonValue;
  subscriptionData?: Prisma.JsonValue;
  isComplete: boolean;
  submittedAt?: Date | null;
  adminReviewStatus: OnboardingReviewStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class OnboardingService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Basic validators for step data shapes
  private validateOrganizationData(data: any) {
    if (data == null || typeof data !== "object") {
      throw new Error("Invalid organization data");
    }
    // Optional basic keys (name/organizationName, contact, address) if provided should be strings
    const keysToCheck = [
      "organizationName", // Frontend uses organizationName
      "name", // Backward compatibility
      "organizationType",
      "email",
      "phone",
      "addressLine1",
      "addressLine2",
      "city",
      "state",
      "zipCode",
      "county",
      "website",
      "ein",
      "npi",
      "fax",
      "primaryLicenseType", // Provider field
      "acceptsReferrals", // Provider field (boolean)
      "responseTimeHours", // Provider field (number)
    ];
    for (const key of keysToCheck) {
      if (data[key] != null) {
        // Special handling for boolean and number fields
        if (key === "acceptsReferrals" && typeof data[key] !== "boolean") {
          throw new Error(`Invalid organization data: ${key} must be a boolean`);
        } else if (key === "responseTimeHours" && typeof data[key] !== "number") {
          throw new Error(`Invalid organization data: ${key} must be a number`);
        } else if (key !== "acceptsReferrals" && key !== "responseTimeHours" && typeof data[key] !== "string") {
          throw new Error(`Invalid organization data: ${key} must be a string`);
        }
      }
    }
  }

  private validateLicenseData(data: any) {
    if (data == null || typeof data !== "object") {
      throw new Error("Invalid license data");
    }
    // Expect licenses array if present
    if (data.licenses != null) {
      if (!Array.isArray(data.licenses)) {
        throw new Error("Invalid license data: licenses must be an array");
      }
      for (const lic of data.licenses) {
        if (lic && typeof lic === "object") {
          // Required fields
          if (lic.licenseType != null && typeof lic.licenseType !== "string") {
            throw new Error(
              "Invalid license data: licenseType must be a string"
            );
          }
          if (
            lic.licenseNumber != null &&
            typeof lic.licenseNumber !== "string"
          ) {
            throw new Error(
              "Invalid license data: licenseNumber must be a string"
            );
          }
          // Optional fields
          if (lic.issueDate != null && typeof lic.issueDate !== "string") {
            throw new Error(
              "Invalid license data: issueDate must be a string (ISO date)"
            );
          }
          if (lic.expirationDate != null && typeof lic.expirationDate !== "string") {
            throw new Error(
              "Invalid license data: expirationDate must be a string (ISO date)"
            );
          }
          if (lic.documentUrl != null && typeof lic.documentUrl !== "string") {
            throw new Error(
              "Invalid license data: documentUrl must be a string"
            );
          }
          if (lic.fileName != null && typeof lic.fileName !== "string") {
            throw new Error(
              "Invalid license data: fileName must be a string"
            );
          }
        }
      }
    }
  }

  private validateServiceData(data: any) {
    if (data == null || typeof data !== "object") {
      throw new Error("Invalid service data");
    }
    if (data.selectedServices != null) {
      if (!Array.isArray(data.selectedServices)) {
        throw new Error(
          "Invalid service data: selectedServices must be an array"
        );
      }
      for (const id of data.selectedServices) {
        if (typeof id !== "string") {
          throw new Error("Invalid service data: service IDs must be strings");
        }
      }
    }
  }

  private validateSubscriptionData(data: any) {
    if (data == null || typeof data !== "object") {
      throw new Error("Invalid subscription data");
    }
    // Accept both 'tier' and 'subscriptionTier' for backward compatibility
    if (data.subscriptionTier != null && typeof data.subscriptionTier !== "string") {
      throw new Error("Invalid subscription data: subscriptionTier must be a string");
    }
    if (data.tier != null && typeof data.tier !== "string") {
      throw new Error("Invalid subscription data: tier must be a string");
    }
  }

  /**
   * Get or create onboarding state for a provider
   */
  async getOnboardingState(
    providerId: string
  ): Promise<OnboardingState | null> {
    try {
      let onboardingState =
        await this.prisma.providerOnboardingState.findUnique({
          where: { providerId },
        });

      // Create if doesn't exist
      if (!onboardingState) {
        onboardingState = await this.prisma.providerOnboardingState.create({
          data: {
            providerId,
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

      return {
        id: onboardingState.id,
        providerId: onboardingState.providerId,
        currentStep: onboardingState.currentStep,
        completedSteps: onboardingState.completedSteps as number[],
        organizationData: onboardingState.organizationData as any,
        licenseData: onboardingState.licenseData as any,
        serviceData: onboardingState.serviceData as any,
        subscriptionData: onboardingState.subscriptionData as any,
        isComplete: onboardingState.isComplete,
        submittedAt: onboardingState.submittedAt || undefined,
        adminReviewStatus: onboardingState.adminReviewStatus,
        reviewedBy: onboardingState.reviewedBy || undefined,
        reviewedAt: onboardingState.reviewedAt || undefined,
        reviewNotes: onboardingState.reviewNotes || undefined,
        createdAt: onboardingState.createdAt,
        updatedAt: onboardingState.updatedAt,
      };
    } catch (error) {
      console.error("Error getting onboarding state:", error);
      throw new Error("Failed to get onboarding state");
    }
  }

  /**
   * Update onboarding step data
   */
  async updateOnboardingStep(
    providerId: string,
    stepData: OnboardingStepData
  ): Promise<OnboardingState> {
    try {
      const { step, data, isComplete = false } = stepData;

      // Get current state
      const currentState = await this.getOnboardingState(providerId);
      if (!currentState) {
        throw new Error("Onboarding state not found");
      }

      // Prepare update data
      const updateData: any = {
        // Advance currentStep when a step is completed; otherwise, at least reflect the furthest visited step
        currentStep: isComplete
          ? Math.max(currentState.currentStep, step + 1)
          : Math.max(currentState.currentStep, step),
        updatedAt: new Date(),
      };

      // Update completed steps
      let completedSteps = [...currentState.completedSteps];
      if (isComplete && !completedSteps.includes(step)) {
        completedSteps.push(step);
        completedSteps.sort((a, b) => a - b);
      }
      updateData.completedSteps = completedSteps;

      // Update step-specific data
      switch (step) {
        case 0: // Organization setup
          this.validateOrganizationData(data);
          updateData.organizationData = data;
          break;
        case 1: // License upload
          this.validateLicenseData(data);
          updateData.licenseData = data;
          break;
        case 2: // Service selection
          this.validateServiceData(data);
          updateData.serviceData = data;
          break;
        case 3: // Subscription plan
          this.validateSubscriptionData(data);
          updateData.subscriptionData = data;
          break;
      }

      // Update in database
      const updatedState = await this.prisma.providerOnboardingState.update({
        where: { providerId },
        data: updateData,
      });

      return {
        id: updatedState.id,
        providerId: updatedState.providerId,
        currentStep: updatedState.currentStep,
        completedSteps: updatedState.completedSteps as number[],
        organizationData: updatedState.organizationData as any,
        licenseData: updatedState.licenseData as any,
        serviceData: updatedState.serviceData as any,
        subscriptionData: updatedState.subscriptionData as any,
        isComplete: updatedState.isComplete,
        submittedAt: updatedState.submittedAt || undefined,
        adminReviewStatus: updatedState.adminReviewStatus,
        reviewedBy: updatedState.reviewedBy || undefined,
        reviewedAt: updatedState.reviewedAt || undefined,
        reviewNotes: updatedState.reviewNotes || undefined,
        createdAt: updatedState.createdAt,
        updatedAt: updatedState.updatedAt,
      };
    } catch (error) {
      console.error("Error updating onboarding step:", error);
      throw new Error("Failed to update onboarding step");
    }
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(providerId: string): Promise<OnboardingState> {
    try {
      const updatedState = await this.prisma.providerOnboardingState.update({
        where: { providerId },
        data: {
          isComplete: true,
          submittedAt: new Date(),
          adminReviewStatus: OnboardingReviewStatus.PENDING,
          updatedAt: new Date(),
        },
      });

      return {
        id: updatedState.id,
        providerId: updatedState.providerId,
        currentStep: updatedState.currentStep,
        completedSteps: updatedState.completedSteps as number[],
        organizationData: updatedState.organizationData as any,
        licenseData: updatedState.licenseData as any,
        serviceData: updatedState.serviceData as any,
        subscriptionData: updatedState.subscriptionData as any,
        isComplete: updatedState.isComplete,
        submittedAt: updatedState.submittedAt || undefined,
        adminReviewStatus: updatedState.adminReviewStatus,
        reviewedBy: updatedState.reviewedBy || undefined,
        reviewedAt: updatedState.reviewedAt || undefined,
        reviewNotes: updatedState.reviewNotes || undefined,
        createdAt: updatedState.createdAt,
        updatedAt: updatedState.updatedAt,
      };
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw new Error("Failed to complete onboarding");
    }
  }

  /**
   * Admin review onboarding
   */
  async reviewOnboarding(
    providerId: string,
    reviewData: {
      status: OnboardingReviewStatus;
      reviewedBy: string;
      notes?: string;
    }
  ): Promise<OnboardingState> {
    try {
      const { status, reviewedBy, notes } = reviewData;

      const updatedState = await this.prisma.providerOnboardingState.update({
        where: { providerId },
        data: {
          adminReviewStatus: status,
          reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: notes,
          updatedAt: new Date(),
        },
      });

      // If approved, also update provider verification status
      if (status === OnboardingReviewStatus.APPROVED) {
        await this.prisma.provider.update({
          where: { id: providerId },
          data: {
            verified: true,
            verifiedAt: new Date(),
          },
        });
      }

      return {
        id: updatedState.id,
        providerId: updatedState.providerId,
        currentStep: updatedState.currentStep,
        completedSteps: updatedState.completedSteps as number[],
        organizationData: updatedState.organizationData as any,
        licenseData: updatedState.licenseData as any,
        serviceData: updatedState.serviceData as any,
        subscriptionData: updatedState.subscriptionData as any,
        isComplete: updatedState.isComplete,
        submittedAt: updatedState.submittedAt || undefined,
        adminReviewStatus: updatedState.adminReviewStatus,
        reviewedBy: updatedState.reviewedBy || undefined,
        reviewedAt: updatedState.reviewedAt || undefined,
        reviewNotes: updatedState.reviewNotes || undefined,
        createdAt: updatedState.createdAt,
        updatedAt: updatedState.updatedAt,
      };
    } catch (error) {
      console.error("Error reviewing onboarding:", error);
      throw new Error("Failed to review onboarding");
    }
  }

  /**
   * Get all pending onboarding reviews (for admin)
   */
  async getPendingReviews(): Promise<OnboardingState[]> {
    try {
      const pendingReviews = await this.prisma.providerOnboardingState.findMany(
        {
          where: {
            isComplete: true,
            adminReviewStatus: {
              in: [
                OnboardingReviewStatus.PENDING,
                OnboardingReviewStatus.IN_REVIEW,
              ],
            },
          },
          include: {
            provider: {
              include: {
                organization: true,
              },
            },
          },
          orderBy: {
            submittedAt: "asc",
          },
        }
      );

      return pendingReviews.map((state) => ({
        id: state.id,
        providerId: state.providerId,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps as number[],
        organizationData: state.organizationData as any,
        licenseData: state.licenseData as any,
        serviceData: state.serviceData as any,
        subscriptionData: state.subscriptionData as any,
        isComplete: state.isComplete,
        submittedAt: state.submittedAt || undefined,
        adminReviewStatus: state.adminReviewStatus,
        reviewedBy: state.reviewedBy || undefined,
        reviewedAt: state.reviewedAt || undefined,
        reviewNotes: state.reviewNotes || undefined,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
      }));
    } catch (error) {
      console.error("Error getting pending reviews:", error);
      throw new Error("Failed to get pending reviews");
    }
  }

  /**
   * Reset onboarding (for cases where changes are needed)
   */
  async resetOnboarding(providerId: string): Promise<OnboardingState> {
    try {
      const updatedState = await this.prisma.providerOnboardingState.update({
        where: { providerId },
        data: {
          isComplete: false,
          submittedAt: null,
          adminReviewStatus: OnboardingReviewStatus.NEEDS_CHANGES,
          updatedAt: new Date(),
        },
      });

      // Also update provider verification status
      await this.prisma.provider.update({
        where: { id: providerId },
        data: {
          verified: false,
          verifiedAt: null,
        },
      });

      return {
        id: updatedState.id,
        providerId: updatedState.providerId,
        currentStep: updatedState.currentStep,
        completedSteps: updatedState.completedSteps as number[],
        organizationData: updatedState.organizationData as any,
        licenseData: updatedState.licenseData as any,
        serviceData: updatedState.serviceData as any,
        subscriptionData: updatedState.subscriptionData as any,
        isComplete: updatedState.isComplete,
        submittedAt: updatedState.submittedAt || undefined,
        adminReviewStatus: updatedState.adminReviewStatus,
        reviewedBy: updatedState.reviewedBy || undefined,
        reviewedAt: updatedState.reviewedAt || undefined,
        reviewNotes: updatedState.reviewNotes || undefined,
        createdAt: updatedState.createdAt,
        updatedAt: updatedState.updatedAt,
      };
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      throw new Error("Failed to reset onboarding");
    }
  }
}

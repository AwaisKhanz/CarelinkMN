import { ApiResponse } from "@carelink/types";

// Exact types from Prisma schema
export type OnboardingReviewStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_CHANGES";

export interface OnboardingState {
  id: string;
  providerId: string;
  currentStep: number;
  completedSteps: number[];
  organizationData?: Record<string, any> | null;
  licenseData?: Record<string, any> | null;
  serviceData?: Record<string, any> | null;
  subscriptionData?: Record<string, any> | null;
  isComplete: boolean;
  submittedAt?: Date | null;
  adminReviewStatus: OnboardingReviewStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingStepData {
  step: number;
  data: Record<string, any>;
  isComplete?: boolean;
}

export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  documentType: string;
  originalName: string;
  mimeType: string;
}

export class OnboardingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:3001";
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem("auth_token");

    const response = await fetch(`${this.baseUrl}/api/onboarding${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  private async makeFormRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem("auth_token");

    const response = await fetch(`${this.baseUrl}/api/onboarding${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Get current onboarding state
   */
  async getOnboardingState(): Promise<OnboardingState> {
    const response = await this.makeRequest<OnboardingState>("/state");
    return response.data!;
  }

  /**
   * Update onboarding step data
   */
  async updateOnboardingStep(
    stepData: OnboardingStepData
  ): Promise<OnboardingState> {
    const response = await this.makeRequest<OnboardingState>("/step", {
      method: "PUT",
      body: JSON.stringify(stepData),
    });
    return response.data!;
  }

  /**
   * Upload document (uses separate upload API)
   */
  async uploadDocument(
    file: File,
    documentType: string = "license",
    folder: string = "licenses"
  ): Promise<FileUploadResponse> {
    const token = localStorage.getItem("auth_token");
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", documentType);
    formData.append("folder", folder);

    const response = await fetch(`${this.baseUrl}/api/upload/document`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result.data!;
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(): Promise<OnboardingState> {
    const response = await this.makeRequest<OnboardingState>("/complete", {
      method: "POST",
    });
    return response.data!;
  }

  /**
   * Admin: Get pending reviews
   */
  async getPendingReviews(): Promise<OnboardingState[]> {
    const response =
      await this.makeRequest<OnboardingState[]>("/admin/pending");
    return response.data!;
  }

  /**
   * Admin: Review onboarding
   */
  async reviewOnboarding(
    providerId: string,
    status: OnboardingReviewStatus,
    notes?: string
  ): Promise<OnboardingState> {
    const response = await this.makeRequest<OnboardingState>(
      `/admin/review/${providerId}`,
      {
        method: "PUT",
        body: JSON.stringify({ status, notes }),
      }
    );
    return response.data!;
  }

  /**
   * Admin: Reset onboarding
   */
  async resetOnboarding(providerId: string): Promise<OnboardingState> {
    const response = await this.makeRequest<OnboardingState>(
      `/admin/reset/${providerId}`,
      {
        method: "PUT",
      }
    );
    return response.data!;
  }
}

export const onboardingService = new OnboardingService();

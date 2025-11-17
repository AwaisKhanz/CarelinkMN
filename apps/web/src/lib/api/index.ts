// Export API configuration and base service
export { apiService, ApiService } from "./config";

// Export all services
export { authService, AuthService } from "./services/auth.service";
export {
  organizationService,
  OrganizationService,
} from "./services/organization.service";
export { homeService, HomeService } from "./services/home.service";
export { openingService, OpeningService } from "./services/opening.service";
export {
  placementService,
  PlacementService,
} from "./services/placement.service";
export {
  analyticsService,
  AnalyticsService,
} from "./services/analytics.service";
export {
  messagingService,
  MessagingService,
} from "./services/messaging.service";
export { providerService, ProviderService } from "./services/provider.service";
export {
  OnboardingService,
  onboardingService,
  type OnboardingState,
  type FileUploadResponse,
} from "./services/onboarding.service";
export {
  UploadService,
  uploadService,
  type FileUploadResponse as UploadFileResponse,
} from "./services/upload.service";
export { referralService, ReferralService } from "./services/referral.service";
export { caseManagerService, CaseManagerService } from "./services/case-manager.service";
export { aiSearchService, AISearchService } from "./services/ai-search.service";
export { notificationService } from "./services/notification.service";

// Export types
export type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from "./services/auth.service";
export type {
  Organization,
  OrganizationCreateData,
  OrganizationUpdateData,
  SearchOrganizationsParams,
  GetOrganizationsParams,
} from "./types/organization.types";
export type {
  Home,
  HomePhoto,
  HomeAmenity,
  CreateHomeData,
  UpdateHomeData,
  GetHomesParams,
  ProviderHomesResponse,
} from "./services/home.service";
export type {
  Opening,
  CreateOpeningPayload as CreateOpeningData,
  UpdateOpeningPayload as UpdateOpeningData,
  PaginatedOpenings,
  OpeningsByStatus,
} from "@carelink/types";
export type {
  Placement,
  CreatePlacementPayload as CreatePlacementData,
  UpdatePlacementPayload as UpdatePlacementData,
  PaginatedPlacements,
} from "@carelink/types";
export type { GetOpeningsParams } from "./services/opening.service";
export type { GetPlacementsParams } from "./services/placement.service";
export type { ProviderReferralsResponse } from "./services/provider.service";
export type { GetAnalyticsParams } from "./services/analytics.service";
export type { GetThreadsResponse } from "./services/messaging.service";
export type {
  ProviderAnalytics,
  FunnelMetrics,
  FillTimeMetrics,
  ResponseTimeMetrics,
  PayerMixAnalysis,
  ProviderAnalyticsFilters,
  MessageThread,
  Message,
  MessageAttachment,
  MessageAttachmentData,
  CreateMessageData,
  CreateThreadData,
  GetThreadsParams,
  ThreadStatus,
  License,
  CreateLicenseData,
  UpdateLicenseData,
  LicenseStatus,
} from "@carelink/types";
export { OpeningStatus, Gender, Payer, PlacementStatus, ReferralStatus, ShortlistStatus, Urgency } from "@carelink/types";
export type {
  Provider,
  ProviderLicense,
  CreateProviderData,
  UpdateProviderData,
  CreateProviderLicenseData,
  UpdateProviderLicenseData,
  GetProvidersParams,
  StaffMember,
} from "./services/provider.service";
export type {
  Referral,
  CreateReferralData,
  UpdateReferralData,
  ReferralShortlist,
  AddToShortlistData,
  UpdateShortlistData,
  BatchMessageData,
  BatchShortlistData,
  GetReferralsParams,
  PaginatedReferrals,
  CaseManager,
  CaseManagerDashboard,
  CaseManagerStats,
  UpdateCaseManagerData,
} from "@carelink/types";
export type {
  Notification,
  GetNotificationsParams,
  GetNotificationsResponse,
} from "./services/notification.service";
// Export shared types from @carelink/types
export type {
  Service,
  HomeService as HomeServiceType,
  ProviderService as ProviderServiceType,
} from "@carelink/types";

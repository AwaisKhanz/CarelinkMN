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
export {
  caseManagerService,
  CaseManagerService,
} from "./services/case-manager.service";
export { aiSearchService, AISearchService } from "./services/ai-search.service";
export { notificationService } from "./services/notification.service";
export {
  messageTemplateService,
  MessageTemplateService,
} from "./services/message-template.service";
export {
  dischargeCaseService,
  DischargeCaseService,
} from "./services/discharge-case.service";
export {
  transportBookingService,
  TransportBookingService,
} from "./services/transport-booking.service";
export { consentService, ConsentService } from "./services/consent.service";
export { hospitalStaffService } from "./services/hospital-staff.service";
export type { HospitalStaffService } from "./services/hospital-staff.service";
export { adminService, AdminService } from "./services/admin.service";
export type {
  GetUsersParams as AdminGetUsersParams,
  UsersResponse as AdminUsersResponse,
  UpdateUserData as AdminUpdateUserData,
  GetOrganizationsParams as AdminGetOrganizationsParams,
  OrganizationsResponse as AdminOrganizationsResponse,
  UpdateOrganizationData as AdminUpdateOrganizationData,
  GetLicensesParams as AdminGetLicensesParams,
  LicensesResponse as AdminLicensesResponse,
  VerifyLicenseData as AdminVerifyLicenseData,
  ComplianceIssue as AdminComplianceIssue,
  ComplianceSummary as AdminComplianceSummary,
  ComplianceIssuesResponse as AdminComplianceIssuesResponse,
  GetComplianceIssuesParams as AdminGetComplianceIssuesParams,
  AuditLogEntry as AdminAuditLogEntry,
  AuditLogsResponse as AdminAuditLogsResponse,
} from "./services/admin.service";
export { vrsService, VRSService } from "./services/vrs.service";
export type {
  GetClientsParams as VRSGetClientsParams,
  VRSClient,
  ClientsResponse as VRSClientsResponse,
  CreateClientData as VRSCreateClientData,
  UpdateClientData as VRSUpdateClientData,
  GetEmployersParams as VRSGetEmployersParams,
  VRSEmployer,
  EmployersResponse as VRSEmployersResponse,
  CreateEmployerData as VRSCreateEmployerData,
  UpdateEmployerData as VRSUpdateEmployerData,
  GetJobsParams as VRSGetJobsParams,
  VRSJob,
  JobsResponse as VRSJobsResponse,
  CreateJobData as VRSCreateJobData,
  UpdateJobData as VRSUpdateJobData,
  GetPlacementsParams as VRSGetPlacementsParams,
  VRSPlacement,
  PlacementsResponse as VRSPlacementsResponse,
  UpdateRetentionData as VRSUpdateRetentionData,
  VRSAnalytics,
} from "./services/vrs.service";

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
export {
  OpeningStatus,
  Gender,
  Payer,
  PlacementStatus,
  ReferralStatus,
  ShortlistStatus,
  Urgency,
  DischargeStatus,
  InviteResponse,
} from "@carelink/types";
export type {
  MessageTemplate,
  CreateMessageTemplateData,
  UpdateMessageTemplateData,
} from "./services/message-template.service";
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
  DischargeCase,
  CreateDischargeCaseData,
  UpdateDischargeCaseData,
  DischargeCaseFilters,
  DischargeInvitation,
  DischargeChecklist,
  PaginatedDischargeCases,
  HospitalSWDashboard,
  HospitalSWAnalytics,
  AIMatchingResult,
} from "@carelink/types";
export type {
  Notification,
  GetNotificationsParams,
  GetNotificationsResponse,
} from "./services/notification.service";
export type {
  HospitalStaff,
  UpdateHospitalStaffData,
} from "./services/hospital-staff.service";
// Export shared types from @carelink/types
export type {
  Service,
  HomeService as HomeServiceType,
  ProviderService as ProviderServiceType,
} from "@carelink/types";

// Export vendor service
export { vendorService } from "./services/vendor.service";
export type {
  GetVendorByUserIdResponse,
  GetVendorByIdResponse,
  UpdateVendorResponse,
  GetVendorLeadsResponse,
  UpdateLeadStatusResponse,
  GetVendorBookingsResponse,
  UpdateBookingStatusResponse,
  GetVendorAnalyticsResponse,
  UpdateBookingStatusData,
} from "./services/vendor.service";
export type {
  Vendor,
  VendorLead,
  VendorAnalytics,
  VendorLeadsResponse,
  VendorBookingsResponse,
  GetVendorLeadsParams,
  GetVendorBookingsParams,
  UpdateVendorData,
  UpdateLeadStatusData,
} from "@carelink/types";

// Export public service (Family Member Dashboard)
export { publicService } from "./services/public.service";
export type {
  PublicSearchParams,
  PublicSearchResponse,
  ProviderPublicProfile,
  GetFavoritesResponse,
  Favorite,
  CreateFavoriteData,
  CareBotQueryRequest,
  CareBotQueryResponse,
  GetPublicProviderParams,
} from "./services/public.service";

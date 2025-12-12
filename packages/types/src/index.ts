// Re-export all types from Prisma
// Note: Database types will be imported when Prisma client is generated

// User roles enum
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  PROVIDER_OWNER = "PROVIDER_OWNER",
  PROVIDER_STAFF = "PROVIDER_STAFF",
  CASE_MANAGER = "CASE_MANAGER",
  HOSPITAL_SW = "HOSPITAL_SW",
  VRS_SPECIALIST = "VRS_SPECIALIST",
  VENDOR = "VENDOR",
  PUBLIC = "PUBLIC",
}

// Organization types enum
export enum OrganizationType {
  PROVIDER = "PROVIDER",
  CASE_MANAGEMENT = "CASE_MANAGEMENT",
  HOSPITAL = "HOSPITAL",
  VRS = "VRS",
  VENDOR = "VENDOR",
}

// User status enum
export enum UserStatus {
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DEACTIVATED = "DEACTIVATED",
}

// Organization status enum
export enum OrganizationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  SUSPENDED = "SUSPENDED",
  DEACTIVATED = "DEACTIVATED",
}

// Subscription tier enum
export enum SubscriptionTier {
  FREE = "FREE",
  PRO = "PRO",
  PREMIUM = "PREMIUM",
  ENTERPRISE = "ENTERPRISE",
}

// Onboarding review status enum
export enum OnboardingReviewStatus {
  PENDING = "PENDING",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  NEEDS_CHANGES = "NEEDS_CHANGES",
}

// ============================================
// BOOST TYPES
// ============================================

export enum BoostPurchaseStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export interface BoostTier {
  level: number;
  name: string;
  influence: number; // Percentage (10, 20, 30)
  monthlyPrice: number; // In cents
  stripePriceId: string;
}

export interface BoostStatus {
  isActive: boolean;
  level: number;
  tier: BoostTier | null;
  expiresAt: Date | null;
  purchasedAt: Date | null;
  isRecurring: boolean;
  metrics: {
    views: number;
    inquiries: number;
    placements: number;
  };
}

export interface CreateBoostCheckoutParams {
  providerId: string;
  boostLevel: number;
  isRecurring: boolean;
}

export interface BoostCheckoutSession {
  sessionId: string;
  url: string;
}

export interface CancelBoostParams {
  providerId: string;
}

// Service types - shared between frontend and backend
export interface Service {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  serviceLicenseTypes?: ServiceLicenseType[];
}

// ServiceLicenseType (junction table) type
export interface ServiceLicenseType {
  id: string;
  serviceId: string;
  licenseTypeId: string;
  licenseType?: LicenseType;
  createdAt?: string;
}

// HomeService (join table) type
export interface HomeService {
  id: string;
  homeId: string;
  serviceId: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  service?: Service;
}

// ProviderService (join table) type
export interface ProviderService {
  id: string;
  providerId: string;
  serviceId: string;
  isActive: boolean;
  createdAt?: string;
  service?: Service;
}

// Common API response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface FunnelMetrics {
  views: number;
  inquiries: number;
  placements: number;
  conversionRate: {
    viewsToInquiries: number;
    inquiriesToPlacements: number;
    viewsToPlacements: number;
  };
}

export interface FillTimeMetrics {
  averageFillTime: number; // In hours
  medianFillTime: number;
  minFillTime: number;
  maxFillTime: number;
  totalOpenings: number;
  filledOpenings: number;
}

export interface ResponseTimeMetrics {
  averageResponseTime: number; // In hours
  medianResponseTime: number;
  responseRate: number; // Percentage of messages responded to
  totalMessages: number;
  respondedMessages: number;
}

export interface PayerMixAnalysis {
  payer: string; // Payer enum value
  count: number;
  percentage: number;
  averageFillTime: number;
}

export interface ProviderAnalytics {
  funnel: FunnelMetrics;
  fillTime: FillTimeMetrics;
  responseTime: ResponseTimeMetrics;
  payerMix: PayerMixAnalysis[];
  summary: {
    totalHomes: number;
    activeOpenings: number;
    totalPlacements: number;
    completedPlacements: number;
    pendingPlacements: number;
  };
}

export interface ProviderAnalyticsFilters {
  providerId: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

// Placement creation from referral
export interface CreatePlacementFromReferralData {
  referralId: string;
  providerId: string;
  homeId: string;
  openingId: string;
  placementDate: string;
  moveInDate?: string;
  notes?: string;
}

// ============================================
// MESSAGING TYPES
// ============================================

export enum ThreadStatus {
  OPEN = "OPEN",
  AWAITING_RESPONSE = "AWAITING_RESPONSE",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profileImage?: string;
  };
  content: string;
  attachments?: MessageAttachment[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  editedAt?: string;
}

export interface MessageThread {
  id: string;
  referralId?: string;
  referral?: {
    id: string;
    referralNumber: string;
    clientInitials: string;
    clientAge: number;
    primaryPayer: string;
  };
  dischargeCaseId?: string;
  dischargeCase?: {
    id: string;
    caseNumber: string;
    patientInitials: string;
    patientAge: number;
    primaryInsurance: string;
  };
  providerId: string;
  provider?: {
    id: string;
    organization: {
      name: string;
    };
  };
  initiatorId: string;
  initiator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  status: ThreadStatus;
  firstResponseAt?: string;
  avgResponseTime?: number; // In minutes
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  closedAt?: string;
  messages?: Message[];
  unreadCount?: number;
}

export interface MessageAttachmentData {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface CreateMessageData {
  threadId: string;
  content: string;
  attachments?: MessageAttachmentData[];
}

export interface CreateThreadData {
  providerId: string;
  referralId?: string;
  dischargeCaseId?: string;
  initialMessage: string;
  attachments?: MessageAttachmentData[];
}

export interface GetThreadsParams {
  providerId?: string;
  referralId?: string;
  dischargeCaseId?: string;
  status?: ThreadStatus;
  page?: number;
  limit?: number;
  search?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export enum NotificationType {
  // PUBLIC (Family Member)
  REQUEST_ASSIGNED = "REQUEST_ASSIGNED",
  REQUEST_STATUS_UPDATE = "REQUEST_STATUS_UPDATE",
  REQUEST_CONVERTED = "REQUEST_CONVERTED",

  // CASE_MANAGER
  NEW_REFERRAL_REQUEST = "NEW_REFERRAL_REQUEST",
  PROVIDER_RESPONSE = "PROVIDER_RESPONSE",
  PLACEMENT_UPDATE = "PLACEMENT_UPDATE",
  URGENT_CASE_ALERT = "URGENT_CASE_ALERT",

  // PROVIDER
  NEW_REFERRAL = "NEW_REFERRAL",
  MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
  OPENING_EXPIRING = "OPENING_EXPIRING",
  PLACEMENT_CONFIRMED = "PLACEMENT_CONFIRMED",
  DISCHARGE_INVITATION_RECEIVED = "DISCHARGE_INVITATION_RECEIVED",

  // HOSPITAL_SW
  DISCHARGE_INVITE_RESPONSE = "DISCHARGE_INVITE_RESPONSE",
  DISCHARGE_PLACEMENT = "DISCHARGE_PLACEMENT",

  // VENDOR
  NEW_LEAD = "NEW_LEAD",
  BOOKING_CONFIRMED = "BOOKING_CONFIRMED",
  BOOKING_COMPLETED = "BOOKING_COMPLETED",

  // VRS_SPECIALIST
  CLIENT_UPDATE = "CLIENT_UPDATE",
  JOB_MATCH = "JOB_MATCH",
  RETENTION_ALERT = "RETENTION_ALERT",
  PLACEMENT_SUCCESS = "PLACEMENT_SUCCESS",

  // SYSTEM
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
  ACCOUNT_UPDATE = "ACCOUNT_UPDATE",
  LICENSE_EXPIRING = "LICENSE_EXPIRING",

  // Legacy
  REFERRAL_NEW = "REFERRAL_NEW",
  REFERRAL_UPDATE = "REFERRAL_UPDATE",
  MESSAGE_NEW = "MESSAGE_NEW",
  INVITE_RECEIVED = "INVITE_RECEIVED",
  INVITE_EXPIRING = "INVITE_EXPIRING",

  // PLACEMENT ENHANCEMENTS
  FOLLOW_UP_REMINDER = "FOLLOW_UP_REMINDER",
  FOLLOW_UP_DUE = "FOLLOW_UP_DUE",
  FOLLOW_UP_OVERDUE = "FOLLOW_UP_OVERDUE",
  DOCUMENT_EXPIRING_SOON = "DOCUMENT_EXPIRING_SOON",
  DOCUMENT_EXPIRED = "DOCUMENT_EXPIRED",
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;
  channels: string[];
  isRead: boolean;
  readAt?: string;
  emailSentAt?: string;
  smsSentAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: string[];
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  emailSentAt?: string;
  smsSentAt?: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}

export interface PaginatedNotifications {
  notifications: NotificationResponse[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
  unreadCount: number;
}
// ============================================

export enum LicenseStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  SUSPENDED = "SUSPENDED",
  REVOKED = "REVOKED",
}

export interface License {
  id: string;
  providerId: string;
  licenseTypeId: string; // CHANGED: now references LicenseType model
  licenseType?: LicenseType; // Optional relation
  licenseNumber: string;
  issueDate: string;
  expirationDate: string;
  status: LicenseStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  documentUrl?: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicenseData {
  licenseTypeId: string; // CHANGED: now references LicenseType model
  licenseNumber: string;
  issueDate: string | Date;
  expirationDate: string | Date;
  documentUrl: string;
  fileName?: string;
}

export interface UpdateLicenseData extends Partial<CreateLicenseData> {
  id?: string;
}

// ============================================
// LICENSE CATEGORY & TYPE TYPES
// ============================================

export interface LicenseCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  licenseTypes?: LicenseType[];
}

export interface CreateLicenseCategoryData {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateLicenseCategoryData extends Partial<CreateLicenseCategoryData> {
  id?: string;
}

export interface LicenseType {
  id: string;
  categoryId: string;
  category?: LicenseCategory;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicenseTypeData {
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateLicenseTypeData extends Partial<CreateLicenseTypeData> {
  id?: string;
}

// Grouped license types by category
export interface LicenseTypesByCategory {
  [categoryId: string]: {
    category: LicenseCategory;
    types: LicenseType[];
  };
}

// License category statistics
export interface LicenseCategoryStats {
  total: number;
  active: number;
  inactive: number;
}

// License type statistics
export interface LicenseTypeStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
  }>;
}

// ============================================
// PROVIDER OPERATIONS TYPES (Openings, Placements, Referrals)
// ============================================

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  NO_PREFERENCE = "NO_PREFERENCE",
}

export enum Payer {
  MA = "MA",
  MEDICARE = "MEDICARE",
  PRIVATE = "PRIVATE",
  CADI = "CADI",
  BI_TBI = "BI_TBI",
  EW = "EW",
  DD = "DD",
}

export enum OpeningStatus {
  OPEN = "OPEN",
  PENDING = "PENDING",
  FILLED = "FILLED",
  EXPIRED = "EXPIRED",
}

export interface OpeningHomeSummary {
  id: string;
  name: string;
  city: string;
  state: string;
  addressLine1: string;
  capacity?: number;
  currentOccupancy?: number;
}

export interface Opening {
  id: string;
  providerId: string;
  homeId: string;
  spotsAvailable: number;
  availableFrom: string;
  availableUntil?: string;
  ageMin?: number;
  ageMax?: number;
  genderPreference?: Gender;
  careLevels: string[];
  supportedNeeds: string[];
  acceptedPayers: Payer[];
  privatePayRate?: number;
  status: OpeningStatus;
  freshnessTimestamp: string;
  expiryReminderSentAt?: string;
  createdAt: string;
  updatedAt: string;
  isFresh?: boolean;
  home?: OpeningHomeSummary;
}

// Opening creation payload
export interface CreateOpeningPayload {
  homeId: string;
  spotsAvailable: number;
  availableFrom: Date | string;
  availableUntil?: Date | string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  genderPreference?: Gender;
  careLevels?: string[];
  supportedNeeds?: string[];
  acceptedPayers: Payer[];
  privatePayRate?: number | null;
}

// Opening update payload (homeId is immutable, so not included)
export interface UpdateOpeningPayload {
  spotsAvailable?: number;
  availableFrom?: Date | string;
  availableUntil?: Date | string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  genderPreference?: Gender;
  careLevels?: string[];
  supportedNeeds?: string[];
  acceptedPayers?: Payer[];
  privatePayRate?: number | null;
  status?: OpeningStatus;
  freshnessTimestamp?: Date | string;
}

// Paginated openings response
export interface PaginatedOpenings {
  openings: Opening[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

// Openings grouped by status (for Kanban board)
export interface OpeningsByStatus {
  [OpeningStatus.OPEN]: Opening[];
  [OpeningStatus.PENDING]: Opening[];
  [OpeningStatus.FILLED]: Opening[];
  [OpeningStatus.EXPIRED]: Opening[];
}

export enum PlacementStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface PlacementTimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  assignedTo?: string;
}

export interface PlacementReferralInfo {
  id: string;
  referralNumber: string;
  clientAge: number;
  clientGender: Gender;
  clientInitials: string;
  careLevels: string[];
  servicesNeeded: string[];
  primaryPayer: Payer;
  targetMoveDate?: string;
  urgency: string;
  status: string;
  preferredCities?: string[];
  preferredCounties?: string[];
}

export interface PlacementDischargeCaseInfo {
  id: string;
  caseNumber: string;
  patientAge: number;
  patientGender: Gender;
  patientInitials: string;
  diagnosisCodes: string[];
  mobilityStatus: string;
  targetDischargeDate: string;
  primaryInsurance: string;
}

export interface PlacementOpeningInfo {
  id: string;
  spotsAvailable: number;
  availableFrom: string;
  availableUntil?: string;
  careLevels: string[];
  supportedNeeds: string[];
  acceptedPayers: Payer[];
  status: OpeningStatus;
  home?: OpeningHomeSummary;
}

export interface PlacementProviderInfo {
  id: string;
  organization?: {
    name: string;
  };
}

export interface Placement {
  id: string;
  referralId?: string;
  dischargeCaseId?: string;
  providerId: string;
  openingId: string;
  placementDate: string;
  moveInDate?: string;
  status: PlacementStatus;
  packetGeneratedAt?: string;
  packetUrl?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  referral?: PlacementReferralInfo;
  dischargeCase?: PlacementDischargeCaseInfo;
  opening?: PlacementOpeningInfo;
  provider?: PlacementProviderInfo;
  timeline?: PlacementTimelineEvent[];
}

// Placement creation payload
export interface CreatePlacementPayload {
  openingId: string;
  referralId?: string;
  dischargeCaseId?: string;
  placementDate: Date | string;
  moveInDate?: Date | string | null;
}

// Placement update payload
export interface UpdatePlacementPayload {
  status?: PlacementStatus;
  placementDate?: Date | string;
  moveInDate?: Date | string | null;
}

// Paginated placements response
export interface PaginatedPlacements {
  placements: Placement[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export enum Urgency {
  URGENT = "URGENT",
  HIGH = "HIGH",
  ROUTINE = "ROUTINE",
}

export enum ReferralStatus {
  NEW = "NEW",
  IN_REVIEW = "IN_REVIEW",
  TOURING = "TOURING",
  OFFER_MADE = "OFFER_MADE",
  PLACED = "PLACED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}

export enum ShortlistStatus {
  ADDED = "ADDED",
  CONTACTED = "CONTACTED",
  RESPONDED = "RESPONDED",
  TOURING = "TOURING",
  DECLINED = "DECLINED",
}

// ============================================
// REFERRAL TYPES
// ============================================

export interface ReferralShortlistSummary {
  id: string;
  status: ShortlistStatus;
  addedAt: string;
  contactedAt?: string;
  respondedAt?: string;
  notes?: string;
}

export interface ReferralShortlist {
  id: string;
  referralId: string;
  providerId: string;
  status: ShortlistStatus;
  addedAt: string;
  contactedAt?: string;
  respondedAt?: string;
  notes?: string;
  referral?: Referral;
  provider?: {
    id: string;
    organization?: {
      id: string;
      name: string;
    };
    homes?: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
    }>;
  };
}

export interface ReferralSummary {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface Referral {
  id: string;
  referralNumber: string;
  caseManagerId: string;
  caseManagerProfileId?: string;
  organizationId: string;
  clientAge: number;
  clientGender: Gender;
  clientInitials: string;
  careLevels: string[];
  servicesNeeded: string[];
  mobilityLevel?: string;
  behavioralNeeds: string[];
  medicalNeeds: string[];
  preferredCounties: string[];
  preferredCities: string[];
  maxDistance?: number;
  primaryPayer: Payer;
  secondaryPayer?: Payer;
  targetMoveDate?: string;
  urgency: Urgency;
  status: ReferralStatus;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  placedAt?: string;
  closedAt?: string;
  // Relations
  caseManager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  caseManagerProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    organizationId: string;
  };
  shortlist?: ReferralShortlist[];
  messages?: MessageThread[];
  placements?: Placement[];
}

// Provider-specific referral types
export interface ProviderReferralListItem {
  id: string;
  referralNumber: string;
  clientAge: number;
  clientGender: Gender;
  clientInitials: string;
  careLevels: string[];
  servicesNeeded: string[];
  primaryPayer: Payer;
  urgency: Urgency;
  targetMoveDate: string | null;
  shortlistStatus: ShortlistStatus;
  shortlistAddedAt: string;
  shortlistContactedAt?: string;
  shortlistRespondedAt?: string;
  shortlistNotes?: string;
  caseManager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export interface ProviderReferralDetail extends ProviderReferralListItem {
  mobilityLevel?: string;
  behavioralNeeds: string[];
  medicalNeeds: string[];
  preferredCounties: string[];
  preferredCities: string[];
  maxDistance: number | null;
  secondaryPayer: Payer | null;
  status: ReferralStatus;
  caseManagerProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface RespondToReferralData {
  status: ShortlistStatus; // RESPONDED, DECLINED, TOURING
  notes?: string;
}

// Referral creation data
export interface CreateReferralData {
  // Client (De-identified)
  clientAge: number;
  clientGender: Gender;
  clientInitials: string;

  // Needs
  careLevels: string[];
  servicesNeeded: string[];
  mobilityLevel?: string;
  behavioralNeeds?: string[];
  medicalNeeds?: string[];

  // Preferences
  preferredCounties: string[];
  preferredCities?: string[];
  maxDistance?: number;

  // Payer
  primaryPayer: Payer;
  secondaryPayer?: Payer;

  // Timeline
  targetMoveDate?: string | Date;
  urgency?: Urgency;

  // Notes
  internalNotes?: string;

  // Initial shortlist (optional)
  providerIds?: string[];
}

// Referral update data
export interface UpdateReferralData {
  // All fields from CreateReferralData optional
  clientAge?: number;
  clientGender?: Gender;
  clientInitials?: string;
  careLevels?: string[];
  servicesNeeded?: string[];
  mobilityLevel?: string;
  behavioralNeeds?: string[];
  medicalNeeds?: string[];
  preferredCounties?: string[];
  preferredCities?: string[];
  maxDistance?: number;
  primaryPayer?: Payer;
  secondaryPayer?: Payer;
  targetMoveDate?: string | Date;
  urgency?: Urgency;
  internalNotes?: string;
  // Status updates
  status?: ReferralStatus;
}

// Shortlist management data
export interface AddToShortlistData {
  providerIds: string[];
  notes?: string;
}

export interface UpdateShortlistData {
  status?: ShortlistStatus;
  notes?: string;
}

// Batch operations data
export interface BatchMessageData {
  referralIds: string[];
  providerIds: string[];
  message: string;
  attachments?: MessageAttachmentData[];
}

export interface BatchShortlistData {
  referralId: string;
  providerIds: string[];
  notes?: string;
}

// Referral query parameters
export interface GetReferralsParams {
  page?: number;
  limit?: number;
  status?: ReferralStatus;
  urgency?: Urgency;
  primaryPayer?: Payer;
  search?: string;
  caseManagerId?: string;
  organizationId?: string;
}

// Paginated referrals response
export interface PaginatedReferrals {
  referrals: Referral[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

// ============================================
// CASE MANAGER TYPES
// ============================================

export interface NotificationPreferences {
  emailNotifications: boolean;
  emailNewReferrals: boolean;
  emailProviderResponses: boolean;
  emailPlacementUpdates: boolean;
  emailUrgentCases: boolean;
  inAppNotifications: boolean;
  inAppNewReferrals: boolean;
  inAppProviderResponses: boolean;
  inAppPlacementUpdates: boolean;
  inAppUrgentCases: boolean;
}

export interface DefaultReferralSettings {
  defaultUrgency: Urgency;
  defaultPrimaryPayer?: Payer;
  defaultPreferredCounties: string[];
  defaultPreferredCities: string[];
  defaultMaxDistance?: number;
  defaultCareLevels: string[];
  defaultServicesNeeded: string[];
}

export interface CaseManager {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseDocumentUrl?: string;
  licenseFileName?: string;
  isActive: boolean;
  notificationPreferences?: NotificationPreferences;
  defaultReferralSettings?: DefaultReferralSettings;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    type: OrganizationType;
    status?: OrganizationStatus;
    email: string;
    phone: string;
    city: string;
    state: string;
    logo?: string;
    coverImage?: string;
  };
}

export interface UpdateCaseManagerData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string | Date;
  licenseDocumentUrl?: string;
  licenseFileName?: string;
  isActive?: boolean;
  notificationPreferences?: NotificationPreferences;
  defaultReferralSettings?: DefaultReferralSettings;
  profileImage?: string;
}

// Case Manager Dashboard
export interface CaseManagerDashboard {
  stats: {
    totalReferrals: number;
    activeReferrals: number;
    pendingPlacements: number;
    completedPlacements: number;
    averagePlacementTime: number; // in days
    responseRate: number; // percentage
  };
  recentReferrals: Referral[];
  urgentReferrals: Referral[];
  recentPlacements: Placement[];
}

// Case Manager Stats
export interface CaseManagerStats {
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  pendingPlacements: number;
  completedPlacements: number;
  averagePlacementTime: number; // in days
  responseRate: number; // percentage
  referralsByStatus: Record<ReferralStatus, number>;
  referralsByUrgency: Record<Urgency, number>;
  referralsByPayer: Record<Payer, number>;
}

// ============================================
// HOSPITAL SOCIAL WORKER / DISCHARGE CASE TYPES
// ============================================

export enum DischargeStatus {
  INTAKE = "INTAKE",
  MATCHING = "MATCHING",
  INVITES_SENT = "INVITES_SENT",
  RESPONSES_PENDING = "RESPONSES_PENDING",
  PLACEMENT_CONFIRMED = "PLACEMENT_CONFIRMED",
  DISCHARGED = "DISCHARGED",
  FOLLOW_UP = "FOLLOW_UP",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum InviteResponse {
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  NO_AVAILABILITY = "NO_AVAILABILITY",
}

export interface DischargeCase {
  id: string;
  caseNumber: string;
  hospitalId: string;
  socialWorkerId: string;
  hospitalStaffId?: string;

  // Patient (Minimal PHI)
  patientInitials: string;
  patientAge: number;
  patientGender: Gender;

  // Medical
  diagnosisCodes: string[];
  mobilityStatus: string;
  cognitiveStatus?: string;
  behavioralConcerns: string[];

  // Equipment Needs
  dmeNeeds: string[];
  medicationManagement: boolean;

  // Discharge Planning
  currentLocation: string;
  targetDischargeDate: string | Date;
  actualDischargeDate?: string | Date;

  // Geography
  preferredCounties: string[];
  preferredCities: string[];
  requiresProximity: boolean;
  proximityZipCode?: string;
  maxDistanceMiles?: number;

  // Payer
  primaryInsurance: Payer;
  secondaryInsurance?: Payer;

  // Status
  status: DischargeStatus;

  // Transport
  needsTransport: boolean;
  transportType?: string;

  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
  matchedAt?: string | Date;
  invitesSentAt?: string | Date;
  placedAt?: string | Date;

  // Relations
  socialWorker?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  hospitalStaff?: {
    id: string;
    department?: string;
    title?: string;
  };
  invitations?: DischargeInvitation[];
  messages?: MessageThread[];
  placement?: Placement;
  transportBooking?: TransportBooking;
  checklist?: DischargeChecklist;
  consent?: Consent;
}

export interface DischargeInvitation {
  id: string;
  dischargeCaseId: string;
  providerId: string;
  provider?: {
    id: string;
    organization?: {
      id: string;
      name: string;
    };
    homes?: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
    }>;
  };

  invitedAt: string | Date;
  expiresAt: string | Date;
  respondedAt?: string | Date;

  response?: InviteResponse;
  responseNotes?: string;

  reminderSentAt?: string | Date;
  escalatedAt?: string | Date;

  dischargeCase?: {
    id: string;
    caseNumber: string;
    patientInitials: string;
    patientAge: number;
    patientGender: Gender;
    diagnosisCodes: string[];
    mobilityStatus: string;
    cognitiveStatus?: string;
    primaryInsurance: Payer;
    targetDischargeDate: string | Date;
    preferredCounties: string[];
    preferredCities: string[];
    status: DischargeStatus;
    hospital?: {
      name: string;
    };
  };
}

export interface DischargeChecklist {
  id: string;
  dischargeCaseId: string;

  // Pre-discharge
  consentObtained: boolean;
  insuranceVerified: boolean;
  medsReconciled: boolean;
  equipmentOrdered: boolean;
  transportArranged: boolean;

  // During discharge
  patientEducated: boolean;
  documentsSent: boolean;
  followUpScheduled: boolean;

  // Post-discharge
  day1Contact: boolean;
  day2Contact: boolean;
  day7Contact: boolean;
  day30Contact: boolean;

  updatedAt: string | Date;
}

export interface CreateDischargeCaseData {
  hospitalId: string;
  patientInitials: string;
  patientAge: number;
  patientGender: Gender;
  diagnosisCodes: string[];
  mobilityStatus: string;
  cognitiveStatus?: string;
  behavioralConcerns: string[];
  dmeNeeds: string[];
  medicationManagement: boolean;
  currentLocation: string;
  targetDischargeDate: string | Date;
  preferredCounties: string[];
  preferredCities: string[];
  requiresProximity: boolean;
  proximityZipCode?: string;
  maxDistanceMiles?: number;
  primaryInsurance: Payer;
  secondaryInsurance?: Payer;
  needsTransport: boolean;
  transportType?: string;
}

export interface UpdateDischargeCaseData
  extends Partial<CreateDischargeCaseData> {
  status?: DischargeStatus;
  actualDischargeDate?: string | Date;
}

export interface DischargeCaseFilters {
  status?: DischargeStatus;
  hospitalId?: string;
  socialWorkerId?: string;
  search?: string;
  targetDischargeDateFrom?: string | Date;
  targetDischargeDateTo?: string | Date;
  page?: number;
  limit?: number;
}

export interface PaginatedDischargeCases {
  cases: DischargeCase[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface HospitalSWDashboard {
  stats: {
    activeCases: number;
    pendingPlacements: number;
    completedThisMonth: number;
    urgentCases: number;
  };
  recentCases: DischargeCase[];
  upcomingDischarges: DischargeCase[];
}

export interface HospitalSWAnalytics {
  summary: {
    totalCases: number;
    activeCases: number;
    completedCases: number;
    cancelledCases: number;
  };
  statusBreakdown: {
    status: DischargeStatus;
    count: number;
    percentage: number;
  }[];
  averagePlacementTime: number; // hours
  responseRate: number; // percentage
  payerMix: {
    payer: Payer;
    count: number;
    percentage: number;
  }[];
  transportStats: {
    totalWithTransport: number;
    transportTypes: {
      type: string;
      count: number;
    }[];
  };
}

export interface AIMatchingResult {
  providers: Array<{
    id: string;
    organization?: {
      name: string;
    };
    matchScore: number;
    matchReasons: string[];
  }>;
  explanation: string;
}

// ============================================
// TRANSPORT BOOKING TYPES
// ============================================

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  IN_TRANSIT = "IN_TRANSIT",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface TransportBooking {
  id: string;
  dischargeCaseId: string;
  vendorId: string;
  vendor?: {
    id: string;
    organization?: {
      id: string;
      name: string;
    };
  };
  pickupAddress: string;
  pickupTime: string | Date;
  dropoffAddress: string;
  vehicleType: string; // "AMBULANCE", "WHEELCHAIR_VAN", "SEDAN"
  equipmentNeeded: string[];
  attendantRequired: boolean;
  status: BookingStatus;
  estimatedCost?: number;
  actualCost?: number;
  payerType: Payer;
  confirmationNumber?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  completedAt?: string | Date;
}

export interface CreateTransportBookingData {
  dischargeCaseId: string;
  vendorId: string;
  pickupAddress: string;
  pickupTime: string | Date;
  dropoffAddress: string;
  vehicleType: string;
  equipmentNeeded?: string[];
  attendantRequired?: boolean;
  estimatedCost?: number;
  payerType: Payer;
}

export interface UpdateTransportBookingData {
  vendorId?: string;
  pickupAddress?: string;
  pickupTime?: string | Date;
  dropoffAddress?: string;
  vehicleType?: string;
  equipmentNeeded?: string[];
  attendantRequired?: boolean;
  status?: BookingStatus;
  estimatedCost?: number;
  actualCost?: number;
  payerType?: Payer;
  confirmationNumber?: string;
  driverName?: string;
  driverPhone?: string;
  completedAt?: string | Date;
}

// ============================================
// CONSENT TYPES
// ============================================

export enum ConsentType {
  REFERRAL = "REFERRAL",
  DISCHARGE = "DISCHARGE",
  PHI_RELEASE = "PHI_RELEASE",
  MARKETING = "MARKETING",
}

export enum CaptureMethod {
  ELECTRONIC_SIGNATURE = "ELECTRONIC_SIGNATURE",
  VERBAL_WITH_WITNESS = "VERBAL_WITH_WITNESS",
  WRITTEN_SCAN = "WRITTEN_SCAN",
}

// ============================================
// VRS SPECIALIST TYPES
// ============================================

export enum VRSClientStatus {
  INTAKE = "INTAKE",
  ASSESSMENT = "ASSESSMENT",
  JOB_READY = "JOB_READY",
  JOB_SEARCHING = "JOB_SEARCHING",
  PLACED = "PLACED",
  FOLLOW_UP = "FOLLOW_UP",
  CLOSED = "CLOSED",
}

export enum JobStatus {
  DRAFT = "DRAFT",
  OPEN = "OPEN",
  FILLED = "FILLED",
  CLOSED = "CLOSED",
}

export enum RetentionStatus {
  RETAINED = "RETAINED",
  NOT_RETAINED = "NOT_RETAINED",
  PENDING = "PENDING",
}

export interface Consent {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  referralId?: string;
  dischargeCaseId?: string;
  consentType: ConsentType;
  consentVersion: string;
  captureMethod: CaptureMethod;
  witnessName?: string;
  witnessTitle?: string;
  signatureData?: string; // Base64 encoded signature
  isActive: boolean;
  revokedAt?: string | Date;
  revokedReason?: string;
  consentedAt: string | Date;
  expiresAt?: string | Date;
}

export interface CreateConsentData {
  userId: string;
  referralId?: string;
  dischargeCaseId?: string;
  consentType: ConsentType;
  consentVersion: string;
  captureMethod: CaptureMethod;
  witnessName?: string;
  witnessTitle?: string;
  signatureData?: string;
  expiresAt?: string | Date;
}

export interface UpdateConsentData {
  consentType?: ConsentType;
  consentVersion?: string;
  captureMethod?: CaptureMethod;
  witnessName?: string;
  witnessTitle?: string;
  signatureData?: string;
  isActive?: boolean;
  revokedAt?: string | Date;
  revokedReason?: string;
  expiresAt?: string | Date;
}

// Case Manager Onboarding Types
export interface CaseManagerOnboardingOrganizationData {
  organizationName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  phone?: string;
  email?: string;
  website?: string;
  ein?: string;
  fax?: string;
  description?: string;
}

export interface CaseManagerOnboardingLicenseData {
  license?: {
    id?: string;
    licenseNumber: string;
    expirationDate: string;
    documentUrl?: string;
    fileName?: string;
  };
}

// Hospital Social Worker Onboarding Types
export interface HospitalSWOnboardingOrganizationData {
  organizationName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  phone?: string;
  email?: string;
  website?: string;
  ein?: string;
  fax?: string;
  description?: string;
}

// Case Manager Client Summary (for clients page)
export interface CaseManagerClientSummary {
  initials: string;
  age: number;
  gender: string;
  referralCount: number;
  latestReferral: Referral;
  status: ReferralStatus;
  urgency: Urgency;
}

// Provider with Availability (for case manager search)
// Note: Provider type is defined in frontend service, this extends it
// For now, we'll define a minimal interface that can be extended
export interface ProviderWithAvailability {
  id: string;
  organizationId: string;
  primaryLicenseTypeId: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  acceptsReferrals: boolean;
  responseTimeHours?: number;
  verified?: boolean;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  subscriptionTier?: SubscriptionTier;
  subscriptionId?: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    type: OrganizationType;
    status?: OrganizationStatus;
    email: string;
    phone: string;
    city: string;
    state: string;
    county?: string;
  };
  primaryLicenseType?: {
    id: string;
    name: string;
    code?: string;
  };
  licenses?: Array<{
    id: string;
    licenseType: string; // Simplified - just the ID string for filtering
  }>;
  homes?: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
  }>;
  // Additional fields for case manager search
  openHomesCount?: number;
  totalOpenings?: number;
  matchingServices?: string[];
  acceptsPayer?: boolean;
  avgResponseTime?: number;
}

// ============================================
// MARKETPLACE VENDOR TYPES
// ============================================

export enum VendorCategory {
  TRAINING = "TRAINING",
  DME = "DME", // Durable Medical Equipment
  HOME_MODS = "HOME_MODS",
  LEGAL = "LEGAL",
  STAFFING = "STAFFING",
  TRANSPORT = "TRANSPORT", // NEMT providers
}

export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  QUALIFIED = "QUALIFIED",
  CONVERTED = "CONVERTED",
  LOST = "LOST",
}

export interface Vendor {
  id: string;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    type: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
  };
  category: VendorCategory;
  subcategories: string[];
  businessName: string;
  description: string;
  logo?: string | null;
  services: string[];
  serviceAreas: string[]; // Counties/Cities served
  isSponsoredVendor: boolean;
  sponsorshipTier?: string | null; // "BASIC", "PREMIUM"
  sponsorshipExpiry?: string | Date | null;
  averageRating?: number | null;
  reviewCount: number;
  isVerified: boolean;
  verifiedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  transportBookings?: TransportBooking[];
  leads?: VendorLead[];
}

export interface VendorLead {
  id: string;
  vendorId: string;
  vendor?: Vendor;
  name: string;
  email: string;
  phone?: string | null;
  servicesInterested: string[];
  message?: string | null;
  source: string; // "MARKETPLACE", "REFERRAL", "AD"
  status: LeadStatus;
  createdAt: string | Date;
  contactedAt?: string | Date | null;
  convertedAt?: string | Date | null;
}

export interface CreateVendorData {
  organizationId: string;
  category: VendorCategory;
  subcategories?: string[];
  businessName: string;
  description: string;
  logo?: string;
  services?: string[];
  serviceAreas?: string[];
  isSponsoredVendor?: boolean;
  sponsorshipTier?: string;
  sponsorshipExpiry?: string | Date;
}

export interface UpdateVendorData {
  category?: VendorCategory;
  subcategories?: string[];
  businessName?: string;
  description?: string;
  logo?: string;
  services?: string[];
  serviceAreas?: string[];
  isSponsoredVendor?: boolean;
  sponsorshipTier?: string;
  sponsorshipExpiry?: string | Date;
}

export interface GetVendorLeadsParams {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  source?: string;
  search?: string;
}

export interface VendorLeadsResponse {
  leads: VendorLead[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface UpdateLeadStatusData {
  status: LeadStatus;
  notes?: string;
}

export interface GetVendorBookingsParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  search?: string;
}

export interface VendorBookingsResponse {
  bookings: TransportBooking[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface VendorAnalytics {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue?: number;
  averageRating?: number;
  reviewCount: number;
  leadsBySource: {
    source: string;
    count: number;
  }[];
  bookingsByStatus: {
    status: BookingStatus;
    count: number;
  }[];
  leadsThisMonth: number;
  bookingsThisMonth: number;
}

// ============================================
// PUBLIC SEARCH TYPES (Family Member Dashboard)
// ============================================

export interface PublicSearchLocation {
  type: "county" | "city" | "zip";
  value: string;
  radius?: number; // in miles
}

export interface PublicSearchAccessibility {
  wheelchairAccessible?: boolean;
  singleLevel?: boolean;
  hasElevator?: boolean;
  hasRollInShower?: boolean;
}

export interface PublicSearchFilters {
  search?: string;
  location?: PublicSearchLocation;
  licenseTypes?: string[];
  serviceTypes?: string[];
  payers?: Payer[];
  accessibility?: PublicSearchAccessibility;
  availability?: "open-only" | "all";
  verified?: boolean;
}

export interface PublicSearchParams extends PublicSearchFilters {
  page?: number;
  limit?: number;
  sortBy?: "relevance" | "distance" | "rating" | "newest";
  viewMode?: "grid" | "list" | "map";
}

export interface PublicSearchResponse {
  providers: ProviderPublicProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HomePhoto {
  url: string;
  caption?: string;
  isPrimary: boolean;
}

export interface HomePublicProfile {
  id: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  photos: HomePhoto[];
  capacity: number;
  currentOccupancy: number;
  accessibility: {
    wheelchairAccessible: boolean;
    singleLevel: boolean;
    hasElevator: boolean;
    hasRollInShower: boolean;
  };
  services: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
  }>;
  openings: Array<{
    id: string;
    spotsAvailable: number;
    availableFrom: string | Date;
    acceptedPayers: Payer[];
    careLevels: string[];
    supportedNeeds: string[];
  }>;
}

export interface ProviderPublicProfile {
  id: string;
  organizationName: string;
  description?: string;
  logo?: string;
  verified: boolean;
  subscriptionTier: SubscriptionTier;
  boostLevel?: number; // 0 = no boost, 1-3 = boost levels
  homes: HomePublicProfile[];
  primaryLicenseType?: string; // License type name/code
  licenses: Array<{
    licenseType: string;
    licenseNumber: string;
    expirationDate: string | Date;
  }>;
  averageRating?: number;
  reviewCount: number;
  distance?: number; // in miles, if location provided
  createdAt?: Date | string;
}

export interface Favorite {
  id: string;
  userId: string;
  providerId: string;
  provider: ProviderPublicProfile;
  createdAt: string | Date;
}

export interface GetFavoritesResponse {
  favorites: Favorite[];
  total: number;
}

export interface CreateFavoriteData {
  providerId: string;
}

export interface CareBotQueryRequest {
  query: string;
  userId?: string; // Optional for rate limiting
}

export interface CareBotQueryResponse {
  filters: Partial<PublicSearchFilters>;
  explanation?: string;
  confidence?: number;
}

// API Request/Response Types for Public Search
export interface GetPublicProvidersParams extends PublicSearchParams {}

export interface GetPublicProviderParams {
  providerId: string;
  userLocation?: {
    lat: number;
    lon: number;
  };
}

// ============================================
// PUBLIC REFERRAL REQUEST TYPES (Family Member Requests)
// ============================================

export enum RequestStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  CONVERTED = "CONVERTED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}

export interface CreateReferralRequestData {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  recipientAge: number;
  recipientGender: string;
  recipientInitials: string;
  careNeeds: string;
  urgency: string;
  preferredCounties?: string[];
  primaryPayer?: string;
  secondaryPayer?: string;
  interestedProviderIds?: string[];
}

export interface UpdateReferralRequestData {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  careNeeds?: string;
  urgency?: string;
  preferredCounties?: string[];
  primaryPayer?: string;
  secondaryPayer?: string;
  interestedProviderIds?: string[];
}

export interface ReferralRequest {
  id: string;
  requestNumber: string;
  userId: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  recipientAge: number;
  recipientGender: string;
  recipientInitials: string;
  careNeeds: string;
  urgency: string;
  preferredCounties: string[];
  primaryPayer?: string;
  secondaryPayer?: string;
  interestedProviderIds: string[];
  status: string;
  assignedCaseManagerId?: string;
  assignedCaseManager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  assignedAt?: string;
  convertedToReferralId?: string;
  convertedToReferral?: {
    id: string;
    referralNumber: string;
    status: string;
  };
  convertedAt?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface ReferralRequestStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  converted: number;
}

export interface GetRequestsParams {
  status?: string;
  urgency?: string;
  page?: number;
  limit?: number;
}

export interface GetRequestsResponse {
  requests: ReferralRequest[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================
// PLACEMENT FOLLOW-UP TYPES
// ============================================

export enum FollowUpType {
  DAY_1_CHECKIN = "DAY_1_CHECKIN",
  DAY_7_CHECKIN = "DAY_7_CHECKIN",
  DAY_30_CHECKIN = "DAY_30_CHECKIN",
  DAY_90_CHECKIN = "DAY_90_CHECKIN",
  CUSTOM = "CUSTOM",
}

export enum FollowUpOutcome {
  POSITIVE = "POSITIVE",
  CONCERNS = "CONCERNS",
  NEEDS_ATTENTION = "NEEDS_ATTENTION",
  NO_RESPONSE = "NO_RESPONSE",
}

export interface PlacementFollowUp {
  id: string;
  placementId: string;
  type: FollowUpType;
  scheduledAt: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  outcome?: FollowUpOutcome;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PLACEMENT DOCUMENT TYPES
// ============================================

export enum DocumentCategory {
  MEDICAL_RECORDS = "MEDICAL_RECORDS",
  INSURANCE = "INSURANCE",
  IDENTIFICATION = "IDENTIFICATION",
  CARE_PLAN = "CARE_PLAN",
  CONSENT_FORM = "CONSENT_FORM",
  PHOTO = "PHOTO",
  OTHER = "OTHER",
}

export interface PlacementDocument {
  id: string;
  placementId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  storageUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  expiresAt?: string;
  notes?: string;
}

// ============================================
// PLACEMENT FAMILY TYPES
// ============================================

export interface PlacementFamilyContact {
  id: string;
  placementId: string;
  name: string;
  relationship: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
  canReceiveUpdates: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UpdateCategory {
  GENERAL = "GENERAL",
  HEALTH = "HEALTH",
  ACTIVITY = "ACTIVITY",
  MILESTONE = "MILESTONE",
  PHOTO = "PHOTO",
}

export interface PlacementUpdate {
  id: string;
  placementId: string;
  title: string;
  message: string;
  category: UpdateCategory;
  photos: string[];
  createdBy: string;
  createdAt: string;
}

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

// Service types - shared between frontend and backend
export interface Service {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  licenseTypes?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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
// LICENSE TYPES
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
  licenseType: string;
  licenseNumber: string;
  issuingState: string;
  issueDate: string;
  expirationDate: string;
  status: LicenseStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicenseData {
  licenseType: string;
  licenseNumber: string;
  issuingState: string;
  issueDate: string | Date;
  expirationDate: string | Date;
  documentUrl: string;
}

export interface UpdateLicenseData extends Partial<CreateLicenseData> {
  id?: string;
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

export interface CaseManager {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    type: OrganizationType;
    email: string;
    phone: string;
    city: string;
    state: string;
  };
}

export interface UpdateCaseManagerData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string | Date;
  isActive?: boolean;
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

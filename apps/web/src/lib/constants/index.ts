/**
 * Shared Constants for CareLinkMN
 *
 * This file contains all reusable constants used across the application.
 * Import from here instead of hardcoding values in individual components.
 *
 * NOTE: Pure data constants are now exported from @carelink/utils.
 * This file re-exports them for backward compatibility and includes
 * UI-specific constants (badge configs with icons, etc.).
 */

// ============================================
// RE-EXPORT SHARED CONSTANTS FROM @carelink/utils
// ============================================
// Re-export all pure data constants from the shared package
export {
  // Minnesota counties
  MINNESOTA_COUNTIES,
  // Care levels
  CARE_LEVELS,
  type CareLevelOption,
  // Supported needs
  SUPPORTED_NEEDS,
  type SupportedNeedOption,
  // Behavioral needs
  BEHAVIORAL_NEEDS,
  type BehavioralNeedOption,
  // Medical needs
  MEDICAL_NEEDS,
  type MedicalNeedOption,
  // Payers (PAYER_OPTIONS not re-exported - web app has its own version with Payer enum)
  PAYER_TYPES,
  // License types
  LICENSE_TYPES,
  type LicenseTypeOption,
  // Gender options
  GENDER_OPTIONS,
  GENDER_PREFERENCES,
  type GenderOption,
  // Transport types
  TRANSPORT_TYPES,
  type TransportTypeOption,
  // Mobility status
  MOBILITY_STATUS_OPTIONS,
  MOBILITY_LEVELS,
  type MobilityStatusOption,
  // Cognitive status
  COGNITIVE_STATUS_OPTIONS,
  type CognitiveStatusOption,
  // DME needs
  DME_NEEDS_OPTIONS,
  type DMENeedOption,
  // Behavioral concerns
  BEHAVIORAL_CONCERNS_OPTIONS,
  type BehavioralConcernOption,
  // Hospital locations
  HOSPITAL_LOCATIONS,
  type HospitalLocationOption,
  // Countries
  COUNTRIES,
  type Country,
  // Other constants
  SERVICE_CATEGORIES,
  USER_ROLES,
  // Note: ORGANIZATION_TYPES is NOT re-exported - web app has its own version with labels
  URGENCY_LEVELS,
  PERFORMANCE_TARGETS,
  ERROR_CODES,
  FILE_LIMITS,
  RATE_LIMITS,
  CACHE_TTL,
  BUSINESS_HOURS,
  NOTIFICATION_CHANNELS,
  AUDIT_ACTIONS,
  OPENING_EXPIRY_HOURS,
  OPENING_EXPIRY_WARNING_HOURS,
  MAX_OPENINGS_FETCH_LIMIT,
  RECENT_ITEMS_LIMIT,
  PAGINATION_DEFAULTS,
  SUBSCRIPTION_TIERS,
  // AI Search
  AI_SEARCH_RATE_LIMIT,
  AI_SEARCH_MIN_QUERY_LENGTH,
  // Vehicle types
  VEHICLE_TYPES,
  type VehicleTypeOption,
  // Lead sources
  LEAD_SOURCES,
  type LeadSourceOption,
} from "@carelink/utils";

// Import constants explicitly for use in MAP helpers below
import {
  TRANSPORT_TYPES,
  MOBILITY_STATUS_OPTIONS,
  COGNITIVE_STATUS_OPTIONS,
  DME_NEEDS_OPTIONS,
  BEHAVIORAL_CONCERNS_OPTIONS,
  HOSPITAL_LOCATIONS,
  GENDER_OPTIONS,
  CARE_LEVELS,
  SUPPORTED_NEEDS,
  BEHAVIORAL_NEEDS,
  MEDICAL_NEEDS,
  MOBILITY_LEVELS,
} from "@carelink/utils";

import {
  Check,
  Star,
  Zap,
  Crown,
  CheckCircle,
  Calendar,
  Clock,
  AlertCircle as AlertCircleIcon,
  XCircle,
  FileText,
  Search,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ReferralStatus,
  ShortlistStatus,
  Urgency,
  Payer,
  Gender,
  OpeningStatus,
  PlacementStatus,
  DischargeStatus,
  InviteResponse,
  SubscriptionTier,
} from "@carelink/types";
import type { BadgeProps } from "@/components/ui/badge";
import { LICENSE_TYPES } from "@carelink/utils";

// ============================================
// LICENSE TYPES MAP (UI-specific helper)
// ============================================
// Create a map for quick lookups (UI-specific helper, stays in web app)
export const LICENSE_TYPES_MAP: Record<string, string> = LICENSE_TYPES.reduce(
  (acc, type) => {
    acc[type.value] = type.label;
    return acc;
  },
  {} as Record<string, string>
);

// ============================================
// ORGANIZATION TYPES
// ============================================

export interface OrganizationTypeOption {
  value: string;
  label: string;
}

export const ORGANIZATION_TYPES: OrganizationTypeOption[] = [
  { value: "PROVIDER", label: "Healthcare Provider" },
  { value: "CASE_MANAGEMENT", label: "Case Management Agency" },
  { value: "HOSPITAL", label: "Hospital" },
  { value: "VRS", label: "Vocational Rehabilitation Services" },
  { value: "VENDOR", label: "Vendor" },
];

// Organization types as a map for quick lookups
export const ORGANIZATION_TYPES_MAP: Record<string, string> =
  ORGANIZATION_TYPES.reduce(
    (acc, type) => {
      acc[type.value] = type.label;
      return acc;
    },
    {} as Record<string, string>
  );

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export interface SubscriptionPlanOption {
  id: string;
  name: string;
  description: string;
  price: string | number;
  period: string;
  features: string[];
  limitations: string[];
  recommended?: boolean;
  popular?: boolean;
  custom?: boolean;
  icon?: LucideIcon;
  color?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanOption[] = [
  {
    id: "FREE",
    name: "Free Plan",
    description: "Perfect for getting started",
    price: "$0",
    period: "forever",
    features: [
      "Basic listing",
      "1 photo",
      "10 services",
      "Public search visibility",
      "Email support",
    ],
    limitations: [
      "Limited to 1 photo",
      "Limited to 10 services",
      "Basic listing features only",
      "No priority placement",
    ],
    recommended: false,
  },
  {
    id: "PRO",
    name: "Pro Plan",
    description: "Most popular for growing providers",
    price: "$49",
    period: "per month",
    features: [
      "Enhanced visibility",
      "5 photos",
      "Analytics dashboard",
      "Priority search placement",
      "Advanced provider profile",
      "Unlimited services",
      "Email & phone support",
      "Referral management tools",
    ],
    limitations: [],
    recommended: true,
  },
  {
    id: "PREMIUM",
    name: "Premium Plan",
    description: "For established healthcare providers",
    price: "$99",
    period: "per month",
    features: [
      "Maximum boost (top search results)",
      "Priority support (24/7)",
      "Unlimited photos",
      "Advanced analytics & insights",
      "Featured provider listing",
      "Custom branding options",
      "API access",
      "Dedicated account manager",
      "White-label options",
      "Priority referral matching",
    ],
    limitations: [],
    recommended: false,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise Plan",
    description: "For large healthcare organizations",
    price: "Custom",
    period: "pricing",
    features: [
      "Everything in Premium Plan",
      "Custom features & integrations",
      "Multi-location management",
      "Advanced user management",
      "SLA guarantees",
      "Dedicated support team",
      "Custom training sessions",
      "On-premise deployment options",
      "Custom reporting & analytics",
    ],
    limitations: [],
    recommended: false,
  },
];

// Subscription plans as a simple map for display
export const SUBSCRIPTION_PLANS_MAP: Record<string, string> = {
  FREE: "Free Plan",
  PRO: "Pro Plan",
  PREMIUM: "Premium Plan",
  ENTERPRISE: "Enterprise Plan",
};

// Subscription plans as a simple object for basic display
export const SUBSCRIPTION_PLANS_SIMPLE: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  PREMIUM: "Premium",
  ENTERPRISE: "Enterprise",
};

export interface ProviderFeatureGateConfig {
  feature: string;
  requiredPlan: SubscriptionTier;
  description: string;
  compact?: boolean;
}

export const PROVIDER_FEATURE_GATES: Record<
  "analytics" | "placements" | "residents" | "availability" | "messages",
  ProviderFeatureGateConfig
> = {
  analytics: {
    feature: "Analytics Dashboard",
    requiredPlan: SubscriptionTier.PRO,
    description:
      "Upgrade to Pro to access performance insights, conversion metrics, and referral analytics tailored to your organization.",
  },
  placements: {
    feature: "Placement Management",
    requiredPlan: SubscriptionTier.PRO,
    description:
      "Upgrade to Pro to manage active placements, track statuses, and maintain compliance with real-time placement records.",
  },
  residents: {
    feature: "Resident Management",
    requiredPlan: SubscriptionTier.PRO,
    description:
      "Upgrade to Pro to view and manage active residents, track care plans, and keep your occupancy data up to date.",
  },
  availability: {
    feature: "Availability Management",
    requiredPlan: SubscriptionTier.PRO,
    description:
      "Upgrade to Pro to manage organization-wide availability, set occupancy alerts, and publish updates to CareLinkMN search.",
  },
  messages: {
    feature: "Messaging Center",
    requiredPlan: SubscriptionTier.PRO,
    description:
      "Upgrade to Pro to unlock secure messaging with case managers, families, and referral partners directly within CareLinkMN.",
  },
};

// ============================================
// US STATES
// ============================================

export interface StateOption {
  value: string;
  label: string;
}

export const US_STATES: StateOption[] = [
  { value: "MN", label: "Minnesota" },
  { value: "WI", label: "Wisconsin" },
  { value: "IA", label: "Iowa" },
  { value: "ND", label: "North Dakota" },
  { value: "SD", label: "South Dakota" },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WY", label: "Wyoming" },
];

// States as a simple array of codes (for backward compatibility)
export const STATES: string[] = US_STATES.map((state) => state.value);

// States as a map for quick lookups
export const STATES_MAP: Record<string, string> = US_STATES.reduce(
  (acc, state) => {
    acc[state.value] = state.label;
    return acc;
  },
  {} as Record<string, string>
);

// ============================================
// STANDARD AMENITIES (Web App Specific)
// ============================================
// Standard amenities list for provider homes
export const STANDARD_AMENITIES = [
  "24/7 Nursing Care",
  "Medication Management",
  "Physical Therapy",
  "Occupational Therapy",
  "Speech Therapy",
  "Memory Care",
  "Dementia Care",
  "Hospice Care",
  "Private Room",
  "Semi-Private Room",
  "Private Bathroom",
  "Kitchenette",
  "Balcony/Patio",
  "Garden Access",
  "Activity Room",
  "Library",
  "Game Room",
  "Fitness Center",
  "Swimming Pool",
  "Walking Paths",
  "Restaurant-Style Dining",
  "Private Dining Room",
  "Snack Bar",
  "Special Diets",
  "Transportation Services",
  "Medical Appointments",
  "Shopping Trips",
  "WiFi",
  "Cable TV",
  "Computer Access",
  "Video Calling",
  "24/7 Security",
  "Emergency Response",
  "Smoke Detectors",
  "Sprinkler System",
  "Pet Friendly",
  "Family Visits",
  "Overnight Stays",
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get license type label by value
 */
export function getLicenseTypeLabel(value: string): string {
  return LICENSE_TYPES_MAP[value] || value;
}

/**
 * Get organization type label by value
 */
export function getOrganizationTypeLabel(value: string): string {
  return ORGANIZATION_TYPES_MAP[value] || value;
}

/**
 * Get subscription plan label by value
 */
export function getSubscriptionPlanLabel(value: string): string {
  return (
    SUBSCRIPTION_PLANS_MAP[value] || SUBSCRIPTION_PLANS_SIMPLE[value] || value
  );
}

/**
 * Get state label by code
 */
export function getStateLabel(code: string): string {
  return STATES_MAP[code] || code;
}

// MINNESOTA_COUNTIES is now exported from @carelink/utils (see re-exports above)

// ============================================
// REFERRAL & CASE MANAGER CONSTANTS
// ============================================

// Urgency configuration with icons and colors
export interface UrgencyConfig {
  label: string;
  color: BadgeProps["variant"];
  icon: LucideIcon;
}

export const URGENCY_CONFIG: Record<Urgency, UrgencyConfig> = {
  [Urgency.URGENT]: {
    label: "Urgent",
    color: "healthcareError",
    icon: AlertCircleIcon,
  },
  [Urgency.HIGH]: {
    label: "High",
    color: "healthcareWarning",
    icon: Clock,
  },
  [Urgency.ROUTINE]: {
    label: "Routine",
    color: "healthcareInfo",
    icon: Calendar,
  },
};

// Referral status configuration
export interface ReferralStatusConfig {
  label: string;
  color: BadgeProps["variant"];
}

export const REFERRAL_STATUS_CONFIG: Record<
  ReferralStatus,
  ReferralStatusConfig
> = {
  [ReferralStatus.NEW]: {
    label: "New",
    color: "healthcareInfo",
  },
  [ReferralStatus.IN_REVIEW]: {
    label: "In Review",
    color: "healthcareWarning",
  },
  [ReferralStatus.TOURING]: {
    label: "Touring",
    color: "healthcareInfo",
  },
  [ReferralStatus.OFFER_MADE]: {
    label: "Offer Made",
    color: "healthcareSuccess",
  },
  [ReferralStatus.PLACED]: {
    label: "Placed",
    color: "healthcareSuccess",
  },
  [ReferralStatus.CLOSED]: {
    label: "Closed",
    color: "outline",
  },
  [ReferralStatus.CANCELLED]: {
    label: "Cancelled",
    color: "destructive",
  },
};

// Shortlist status configuration
export interface ShortlistStatusConfig {
  label: string;
  color: BadgeProps["variant"];
}

export const SHORTLIST_STATUS_CONFIG: Record<
  ShortlistStatus,
  ShortlistStatusConfig
> = {
  [ShortlistStatus.ADDED]: {
    label: "Added",
    color: "healthcareInfo",
  },
  [ShortlistStatus.CONTACTED]: {
    label: "Contacted",
    color: "healthcareWarning",
  },
  [ShortlistStatus.RESPONDED]: {
    label: "Responded",
    color: "healthcareSuccess",
  },
  [ShortlistStatus.TOURING]: {
    label: "Touring",
    color: "healthcareInfo",
  },
  [ShortlistStatus.DECLINED]: {
    label: "Declined",
    color: "destructive",
  },
};

// ============================================
// HOSPITAL SOCIAL WORKER / DISCHARGE CASE CONSTANTS
// ============================================

// Discharge Status configuration
export interface DischargeStatusConfig {
  label: string;
  color: BadgeProps["variant"];
  icon: LucideIcon;
}

export const DISCHARGE_STATUS_CONFIG: Record<
  DischargeStatus,
  DischargeStatusConfig
> = {
  [DischargeStatus.INTAKE]: {
    label: "Intake",
    color: "outline",
    icon: FileText,
  },
  [DischargeStatus.MATCHING]: {
    label: "Matching",
    color: "healthcareInfo",
    icon: Search,
  },
  [DischargeStatus.INVITES_SENT]: {
    label: "Invites Sent",
    color: "healthcareInfo",
    icon: Send,
  },
  [DischargeStatus.RESPONSES_PENDING]: {
    label: "Awaiting Responses",
    color: "healthcareWarning",
    icon: Clock,
  },
  [DischargeStatus.PLACEMENT_CONFIRMED]: {
    label: "Placement Confirmed",
    color: "healthcareSuccess",
    icon: CheckCircle,
  },
  [DischargeStatus.DISCHARGED]: {
    label: "Discharged",
    color: "healthcareSuccess",
    icon: CheckCircle,
  },
  [DischargeStatus.FOLLOW_UP]: {
    label: "Follow Up",
    color: "healthcareInfo",
    icon: Calendar,
  },
  [DischargeStatus.COMPLETED]: {
    label: "Completed",
    color: "healthcareSuccess",
    icon: CheckCircle,
  },
  [DischargeStatus.CANCELLED]: {
    label: "Cancelled",
    color: "destructive",
    icon: XCircle,
  },
};

// Invite Response configuration
export interface InviteResponseConfig {
  label: string;
  color: BadgeProps["variant"];
}

export const INVITE_RESPONSE_CONFIG: Record<
  InviteResponse,
  InviteResponseConfig
> = {
  [InviteResponse.ACCEPTED]: {
    label: "Accepted",
    color: "healthcareSuccess",
  },
  [InviteResponse.DECLINED]: {
    label: "Declined",
    color: "destructive",
  },
  [InviteResponse.NO_AVAILABILITY]: {
    label: "No Availability",
    color: "healthcareWarning",
  },
};

// ============================================
// UI-SPECIFIC MAP HELPERS (using imported constants)
// ============================================
// These maps are created from the shared constants for quick lookups

// Transport types as a map for quick lookups (using imported TRANSPORT_TYPES)
export const TRANSPORT_TYPES_MAP: Record<string, string> =
  TRANSPORT_TYPES.reduce(
    (acc, type) => {
      acc[type.value] = type.label;
      return acc;
    },
    {} as Record<string, string>
  );

// Mobility status as a map for quick lookups (using imported MOBILITY_STATUS_OPTIONS)
export const MOBILITY_STATUS_MAP: Record<string, string> =
  MOBILITY_STATUS_OPTIONS.reduce(
    (acc, status) => {
      acc[status.value] = status.label;
      return acc;
    },
    {} as Record<string, string>
  );

// Cognitive status as a map for quick lookups (using imported COGNITIVE_STATUS_OPTIONS)
export const COGNITIVE_STATUS_MAP: Record<string, string> =
  COGNITIVE_STATUS_OPTIONS.reduce(
    (acc, status) => {
      acc[status.value] = status.label;
      return acc;
    },
    {} as Record<string, string>
  );

// DME needs as a map for quick lookups (using imported DME_NEEDS_OPTIONS)
export const DME_NEEDS_MAP: Record<string, string> = DME_NEEDS_OPTIONS.reduce(
  (acc, need) => {
    acc[need.value] = need.label;
    return acc;
  },
  {} as Record<string, string>
);

// Behavioral concerns as a map for quick lookups (using imported BEHAVIORAL_CONCERNS_OPTIONS)
export const BEHAVIORAL_CONCERNS_MAP: Record<string, string> =
  BEHAVIORAL_CONCERNS_OPTIONS.reduce(
    (acc, concern) => {
      acc[concern.value] = concern.label;
      return acc;
    },
    {} as Record<string, string>
  );

// Hospital locations as a map for quick lookups (using imported HOSPITAL_LOCATIONS)
export const HOSPITAL_LOCATIONS_MAP: Record<string, string> =
  HOSPITAL_LOCATIONS.reduce(
    (acc, location) => {
      acc[location.value] = location.label;
      return acc;
    },
    {} as Record<string, string>
  );

// ============================================
// PAYER OPTIONS & LABELS (UI-specific - uses Payer enum)
// ============================================
// Payer labels as a map for quick lookups (UI-specific, stays in web app)
export const PAYER_LABELS: Record<Payer, string> = {
  [Payer.MA]: "Medical Assistance",
  [Payer.MEDICARE]: "Medicare",
  [Payer.PRIVATE]: "Private Pay",
  [Payer.CADI]: "CADI",
  [Payer.BI_TBI]: "BI/TBI",
  [Payer.EW]: "Elderly Waiver",
  [Payer.DD]: "Developmental Disabilities",
};

// Web-app-specific PAYER_OPTIONS using Payer enum (overrides shared version)
export interface PayerOptionWeb {
  value: Payer;
  label: string;
}

export const PAYER_OPTIONS_WEB: readonly PayerOptionWeb[] = [
  { value: Payer.MA, label: "Medical Assistance (MA)" },
  { value: Payer.MEDICARE, label: "Medicare" },
  { value: Payer.PRIVATE, label: "Private Pay" },
  { value: Payer.CADI, label: "CADI" },
  { value: Payer.BI_TBI, label: "BI/TBI" },
  { value: Payer.EW, label: "Elderly Waiver (EW)" },
  { value: Payer.DD, label: "Developmental Disabilities (DD)" },
] as const;

// Re-export as PAYER_OPTIONS for web app (overrides shared version)
export const PAYER_OPTIONS = PAYER_OPTIONS_WEB;

// Helper functions for referral constants
export function getUrgencyLabel(urgency: Urgency): string {
  return URGENCY_CONFIG[urgency]?.label || urgency;
}

export function getReferralStatusLabel(status: ReferralStatus): string {
  return REFERRAL_STATUS_CONFIG[status]?.label || status;
}

export function getShortlistStatusLabel(status: ShortlistStatus): string {
  return SHORTLIST_STATUS_CONFIG[status]?.label || status;
}

export function getPayerLabel(payer: Payer): string {
  return PAYER_LABELS[payer] || payer;
}

// Gender labels as a map for quick lookups
export const GENDER_LABELS: Partial<Record<Gender, string>> = {
  [Gender.MALE]: "Male",
  [Gender.FEMALE]: "Female",
  [Gender.OTHER]: "Other",
  [Gender.NO_PREFERENCE]: "No Preference",
};

export function getGenderLabel(gender: Gender): string {
  return GENDER_OPTIONS.find((opt) => opt.value === gender)?.label || gender;
}

export function getCareLevelLabel(level: string): string {
  return CARE_LEVELS.find((opt) => opt.value === level)?.label || level;
}

export function getSupportedNeedLabel(need: string): string {
  return SUPPORTED_NEEDS.find((opt) => opt.value === need)?.label || need;
}

export function getBehavioralNeedLabel(need: string): string {
  return BEHAVIORAL_NEEDS.find((opt) => opt.value === need)?.label || need;
}

export function getMedicalNeedLabel(need: string): string {
  return MEDICAL_NEEDS.find((opt) => opt.value === need)?.label || need;
}

export function getMobilityLevelLabel(level: string): string {
  return (
    MOBILITY_STATUS_OPTIONS.find((opt) => opt.value === level)?.label || level
  );
}

// Helper functions for discharge case constants
export function getDischargeStatusLabel(status: DischargeStatus): string {
  return DISCHARGE_STATUS_CONFIG[status]?.label || status;
}

export function getInviteResponseLabel(response: InviteResponse): string {
  return INVITE_RESPONSE_CONFIG[response]?.label || response;
}

export function getTransportTypeLabel(type: string): string {
  return TRANSPORT_TYPES_MAP[type] || type;
}

export function getMobilityStatusLabel(status: string): string {
  return MOBILITY_STATUS_MAP[status] || status;
}

export function getCognitiveStatusLabel(status: string): string {
  return COGNITIVE_STATUS_MAP[status] || status;
}

export function getDMENeedLabel(need: string): string {
  return DME_NEEDS_MAP[need] || need;
}

export function getBehavioralConcernLabel(concern: string): string {
  return BEHAVIORAL_CONCERNS_MAP[concern] || concern;
}

export function getHospitalLocationLabel(location: string): string {
  return HOSPITAL_LOCATIONS_MAP[location] || location;
}

// ============================================
// OPENING STATUS CONFIGURATION
// ============================================

export interface OpeningStatusConfig {
  label: string;
  color: BadgeProps["variant"];
  icon: LucideIcon;
}

export const OPENING_STATUS_CONFIG: Record<OpeningStatus, OpeningStatusConfig> =
  {
    [OpeningStatus.OPEN]: {
      label: "Open",
      color: "healthcareSuccess",
      icon: CheckCircle,
    },
    [OpeningStatus.PENDING]: {
      label: "Pending",
      color: "healthcareWarning",
      icon: Clock,
    },
    [OpeningStatus.FILLED]: {
      label: "Filled",
      color: "healthcareInfo",
      icon: CheckCircle,
    },
    [OpeningStatus.EXPIRED]: {
      label: "Expired",
      color: "secondary",
      icon: XCircle,
    },
  };

// ============================================
// PLACEMENT STATUS CONFIGURATION
// ============================================

export interface PlacementStatusConfig {
  label: string;
  variant: BadgeProps["variant"];
}

export const PLACEMENT_STATUS_CONFIG: Record<
  PlacementStatus,
  PlacementStatusConfig
> = {
  [PlacementStatus.PENDING]: {
    label: "Pending",
    variant: "healthcareWarning",
  },
  [PlacementStatus.CONFIRMED]: {
    label: "Confirmed",
    variant: "healthcareSuccess",
  },
  [PlacementStatus.IN_PROGRESS]: {
    label: "In Progress",
    variant: "healthcareInfo",
  },
  [PlacementStatus.COMPLETED]: {
    label: "Completed",
    variant: "healthcareSuccess",
  },
  [PlacementStatus.CANCELLED]: {
    label: "Cancelled",
    variant: "healthcareError",
  },
};

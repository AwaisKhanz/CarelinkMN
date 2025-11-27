import {
  DocumentCategory,
  FollowUpOutcome,
  FollowUpType,
  UpdateCategory,
} from "@carelink/types";

// ============================================
// FOLLOW-UP CONSTANTS
// ============================================

export const FOLLOW_UP_TYPES: Record<FollowUpType, string> = {
  [FollowUpType.DAY_1_CHECKIN]: "Day 1 Check-in",
  [FollowUpType.DAY_7_CHECKIN]: "Day 7 Check-in",
  [FollowUpType.DAY_30_CHECKIN]: "Day 30 Check-in",
  [FollowUpType.DAY_90_CHECKIN]: "Day 90 Check-in",
  [FollowUpType.CUSTOM]: "Custom Follow-up",
};

export const FOLLOW_UP_OUTCOMES: Record<FollowUpOutcome, string> = {
  [FollowUpOutcome.POSITIVE]: "Positive",
  [FollowUpOutcome.CONCERNS]: "Concerns Raised",
  [FollowUpOutcome.NEEDS_ATTENTION]: "Needs Attention",
  [FollowUpOutcome.NO_RESPONSE]: "No Response",
};

export const FOLLOW_UP_OUTCOME_COLORS: Record<FollowUpOutcome, string> = {
  [FollowUpOutcome.POSITIVE]: "healthcareSuccess",
  [FollowUpOutcome.CONCERNS]: "healthcareWarning",
  [FollowUpOutcome.NEEDS_ATTENTION]: "healthcareError",
  [FollowUpOutcome.NO_RESPONSE]: "outline",
};

// ============================================
// DOCUMENT CONSTANTS
// ============================================

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, string> = {
  [DocumentCategory.MEDICAL_RECORDS]: "Medical Records",
  [DocumentCategory.INSURANCE]: "Insurance",
  [DocumentCategory.IDENTIFICATION]: "Identification",
  [DocumentCategory.CARE_PLAN]: "Care Plan",
  [DocumentCategory.CONSENT_FORM]: "Consent Form",
  [DocumentCategory.PHOTO]: "Photo",
  [DocumentCategory.OTHER]: "Other",
};

export const DOCUMENT_CATEGORY_COLORS: Record<DocumentCategory, string> = {
  [DocumentCategory.MEDICAL_RECORDS]: "healthcarePrimary",
  [DocumentCategory.INSURANCE]: "healthcareInfo",
  [DocumentCategory.IDENTIFICATION]: "healthcareWarning",
  [DocumentCategory.CARE_PLAN]: "healthcareSuccess",
  [DocumentCategory.CONSENT_FORM]: "secondary",
  [DocumentCategory.PHOTO]: "healthcareAccent",
  [DocumentCategory.OTHER]: "outline",
};

// ============================================
// FAMILY COMMUNICATION CONSTANTS
// ============================================

export const UPDATE_CATEGORIES: Record<UpdateCategory, string> = {
  [UpdateCategory.GENERAL]: "General Update",
  [UpdateCategory.HEALTH]: "Health Update",
  [UpdateCategory.ACTIVITY]: "Activity Update",
  [UpdateCategory.MILESTONE]: "Milestone",
  [UpdateCategory.PHOTO]: "Photo Share",
};

export const UPDATE_CATEGORY_COLORS: Record<UpdateCategory, string> = {
  [UpdateCategory.GENERAL]: "secondary",
  [UpdateCategory.HEALTH]: "healthcarePrimary",
  [UpdateCategory.ACTIVITY]: "healthcareSuccess",
  [UpdateCategory.MILESTONE]: "healthcareWarning",
  [UpdateCategory.PHOTO]: "healthcareAccent",
};

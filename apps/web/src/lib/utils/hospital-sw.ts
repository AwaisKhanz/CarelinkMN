/**
 * Hospital Social Worker utility functions
 * Shared utilities for Hospital SW-related operations
 */

import { DischargeStatus, InviteResponse } from "@carelink/types";
import {
  DISCHARGE_STATUS_CONFIG,
  INVITE_RESPONSE_CONFIG,
} from "@/lib/constants";
import type { BadgeProps } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import { differenceInHours, differenceInDays, isPast, isFuture } from "date-fns";

/**
 * Calculate hours until invitation expiry
 * @param expiresAt - ISO string timestamp of when invitation expires
 * @returns Number of hours until expiry (can be negative if already expired)
 */
export function calculateHoursUntilInvitationExpiry(expiresAt: string): number {
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  return Math.floor(differenceInHours(expiryDate, now));
}

/**
 * Check if an invitation is expiring soon (within 24 hours)
 * @param expiresAt - ISO string timestamp of when invitation expires
 * @returns true if invitation expires within 24 hours
 */
export function isInvitationExpiringSoon(expiresAt: string): boolean {
  const hoursUntilExpiry = calculateHoursUntilInvitationExpiry(expiresAt);
  return hoursUntilExpiry >= 0 && hoursUntilExpiry <= 24;
}

/**
 * Check if an invitation is expired
 * @param expiresAt - ISO string timestamp of when invitation expires
 * @returns true if invitation has expired
 */
export function isInvitationExpired(expiresAt: string): boolean {
  return isPast(new Date(expiresAt));
}

/**
 * Get invitation expiry status
 * @param expiresAt - ISO string timestamp of when invitation expires
 * @returns 'active' | 'expiring_soon' | 'expired'
 */
export function getInvitationExpiryStatus(
  expiresAt: string
): "active" | "expiring_soon" | "expired" {
  if (isInvitationExpired(expiresAt)) {
    return "expired";
  }
  if (isInvitationExpiringSoon(expiresAt)) {
    return "expiring_soon";
  }
  return "active";
}

/**
 * Calculate days until target discharge date
 * @param targetDischargeDate - ISO string timestamp of target discharge date
 * @returns Number of days until discharge (can be negative if past)
 */
export function calculateDaysUntilDischarge(
  targetDischargeDate: string
): number {
  const dischargeDate = new Date(targetDischargeDate);
  const now = new Date();
  return Math.floor(differenceInDays(dischargeDate, now));
}

/**
 * Check if discharge is urgent (within 3 days)
 * @param targetDischargeDate - ISO string timestamp of target discharge date
 * @returns true if discharge is within 3 days
 */
export function isDischargeUrgent(targetDischargeDate: string): boolean {
  const daysUntil = calculateDaysUntilDischarge(targetDischargeDate);
  return daysUntil >= 0 && daysUntil <= 3;
}

/**
 * Check if discharge date has passed
 * @param targetDischargeDate - ISO string timestamp of target discharge date
 * @returns true if discharge date has passed
 */
export function isDischargeDatePassed(targetDischargeDate: string): boolean {
  return isPast(new Date(targetDischargeDate));
}

/**
 * Get discharge urgency status
 * @param targetDischargeDate - ISO string timestamp of target discharge date
 * @returns 'upcoming' | 'urgent' | 'overdue'
 */
export function getDischargeUrgencyStatus(
  targetDischargeDate: string
): "upcoming" | "urgent" | "overdue" {
  if (isDischargeDatePassed(targetDischargeDate)) {
    return "overdue";
  }
  if (isDischargeUrgent(targetDischargeDate)) {
    return "urgent";
  }
  return "upcoming";
}

/**
 * Get discharge status badge configuration
 * @param status - Discharge status
 * @returns Badge configuration with label, variant, and icon
 */
export function getDischargeStatusBadgeConfig(status: DischargeStatus): {
  label: string;
  variant: BadgeProps["variant"];
  icon: LucideIcon;
} {
  const config = DISCHARGE_STATUS_CONFIG[status];
  return {
    label: config.label,
    variant: config.color,
    icon: config.icon,
  };
}

/**
 * Get invite response badge configuration
 * @param response - Invite response
 * @returns Badge configuration with label and variant
 */
export function getInviteResponseBadgeConfig(response: InviteResponse): {
  label: string;
  variant: BadgeProps["variant"];
} {
  const config = INVITE_RESPONSE_CONFIG[response];
  return {
    label: config.label,
    variant: config.color,
  };
}

/**
 * Check if discharge case is active (not completed or cancelled)
 * @param status - Discharge status
 * @returns true if case is active
 */
export function isDischargeCaseActive(status: DischargeStatus): boolean {
  return (
    status !== DischargeStatus.COMPLETED &&
    status !== DischargeStatus.CANCELLED &&
    status !== DischargeStatus.DISCHARGED
  );
}

/**
 * Check if discharge case needs attention (pending responses or urgent)
 * @param status - Discharge status
 * @param targetDischargeDate - Target discharge date
 * @returns true if case needs attention
 */
export function doesDischargeCaseNeedAttention(
  status: DischargeStatus,
  targetDischargeDate: string
): boolean {
  return (
    status === DischargeStatus.RESPONSES_PENDING ||
    isDischargeUrgent(targetDischargeDate)
  );
}

/**
 * Format case number for display
 * @param caseNumber - Case number string
 * @returns Formatted case number
 */
export function formatCaseNumber(caseNumber: string): string {
  return caseNumber.toUpperCase();
}

/**
 * Get patient display name (initials only for privacy)
 * @param initials - Patient initials
 * @returns Display name
 */
export function getPatientDisplayName(initials: string): string {
  return initials || "N/A";
}

/**
 * Calculate average placement time in days
 * @param createdAt - Case creation date
 * @param placedAt - Placement date (optional)
 * @returns Number of days (or null if not placed)
 */
export function calculatePlacementTime(
  createdAt: string,
  placedAt?: string | null
): number | null {
  if (!placedAt) return null;
  const created = new Date(createdAt);
  const placed = new Date(placedAt);
  return Math.floor(differenceInDays(placed, created));
}

/**
 * Check if checklist is complete
 * @param checklist - Checklist object
 * @returns true if all required items are checked
 */
export function isChecklistComplete(checklist: {
  consentObtained: boolean;
  insuranceVerified: boolean;
  medsReconciled: boolean;
  equipmentOrdered: boolean;
  transportArranged: boolean;
}): boolean {
  return (
    checklist.consentObtained &&
    checklist.insuranceVerified &&
    checklist.medsReconciled &&
    checklist.equipmentOrdered &&
    checklist.transportArranged
  );
}

/**
 * Get checklist completion percentage
 * @param checklist - Checklist object
 * @returns Percentage (0-100)
 */
export function getChecklistCompletionPercentage(checklist: {
  consentObtained: boolean;
  insuranceVerified: boolean;
  medsReconciled: boolean;
  equipmentOrdered: boolean;
  transportArranged: boolean;
}): number {
  const items = [
    checklist.consentObtained,
    checklist.insuranceVerified,
    checklist.medsReconciled,
    checklist.equipmentOrdered,
    checklist.transportArranged,
  ];
  const completed = items.filter(Boolean).length;
  return Math.round((completed / items.length) * 100);
}

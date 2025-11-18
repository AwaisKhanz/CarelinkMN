/**
 * Hospital Social Worker utility functions
 * Shared utilities for hospital SW-related operations
 */

import { DischargeCase, DischargeStatus } from "@carelink/types";
import { DISCHARGE_STATUS_CONFIG } from "@/lib/constants";
import type { BadgeProps } from "@/components/ui/badge";

/**
 * Validate discharge case data
 * @param dischargeCase - Discharge Case object to validate
 * @returns true if discharge case is valid
 */
export function isValidDischargeCase(dischargeCase: {
  id?: string;
  hospitalId?: string;
  socialWorkerId?: string;
}): boolean {
  return !!(dischargeCase?.id && dischargeCase?.hospitalId && dischargeCase?.socialWorkerId);
}

/**
 * Get discharge status badge configuration
 * @param status - Discharge status
 * @returns Badge configuration with label, color, and icon
 */
export function getDischargeStatusBadge(status: DischargeStatus) {
  return DISCHARGE_STATUS_CONFIG[status] || DISCHARGE_STATUS_CONFIG[DischargeStatus.INTAKE];
}

/**
 * Check if discharge case is urgent (target discharge date within 24 hours)
 * @param dischargeCase - Discharge case to check
 * @returns true if case is urgent
 */
export function isUrgentDischargeCase(dischargeCase: DischargeCase): boolean {
  const targetDate = new Date(dischargeCase.targetDischargeDate);
  const now = new Date();
  const hoursUntilDischarge = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilDischarge <= 24 && hoursUntilDischarge > 0;
}

/**
 * Check if discharge case is overdue (target discharge date passed)
 * @param dischargeCase - Discharge case to check
 * @returns true if case is overdue
 */
export function isOverdueDischargeCase(dischargeCase: DischargeCase): boolean {
  const targetDate = new Date(dischargeCase.targetDischargeDate);
  const now = new Date();
  return (
    targetDate < now &&
    dischargeCase.status !== DischargeStatus.DISCHARGED &&
    dischargeCase.status !== DischargeStatus.COMPLETED
  );
}

/**
 * Get days until target discharge
 * @param dischargeCase - Discharge case
 * @returns Number of days until target discharge (can be negative if overdue)
 */
export function getDaysUntilDischarge(dischargeCase: DischargeCase): number {
  const targetDate = new Date(dischargeCase.targetDischargeDate);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format discharge case number for display
 * @param caseNumber - Case number from database
 * @returns Formatted case number (e.g., "DC-ABC123")
 */
export function formatDischargeCaseNumber(caseNumber: string): string {
  return `DC-${caseNumber.toUpperCase()}`;
}

/**
 * Check if discharge case can be edited
 * @param dischargeCase - Discharge case
 * @returns true if case can be edited
 */
export function canEditDischargeCase(dischargeCase: DischargeCase): boolean {
  const nonEditableStatuses = [
    DischargeStatus.COMPLETED,
    DischargeStatus.CANCELLED,
    DischargeStatus.DISCHARGED,
  ];
  return !nonEditableStatuses.includes(dischargeCase.status);
}

/**
 * Check if discharge case can be deleted
 * @param dischargeCase - Discharge case
 * @returns true if case can be deleted
 */
export function canDeleteDischargeCase(dischargeCase: DischargeCase): boolean {
  // Only allow deletion if case is in INTAKE or CANCELLED status
  return (
    dischargeCase.status === DischargeStatus.INTAKE || dischargeCase.status === DischargeStatus.CANCELLED
  );
}

/**
 * Get discharge case priority (for sorting)
 * @param dischargeCase - Discharge case
 * @returns Priority number (lower = higher priority)
 */
export function getDischargeCasePriority(dischargeCase: DischargeCase): number {
  if (isOverdueDischargeCase(dischargeCase)) return 0; // Highest priority
  if (isUrgentDischargeCase(dischargeCase)) return 1;
  const daysUntil = getDaysUntilDischarge(dischargeCase);
  if (daysUntil <= 3) return 2;
  if (daysUntil <= 7) return 3;
  return 4; // Lowest priority
}


/**
 * Vendor Utility Functions
 *
 * This file contains utility functions specific to the Vendor dashboard:
 * - Badge configuration helpers
 * - Display name helpers
 * - Format helpers
 */

import type { BadgeProps } from "@/components/ui/badge";
import {
  getBookingStatusBadgeConfig as getBookingStatusConfig,
  getLeadStatusBadgeConfig as getLeadStatusConfig,
  getVendorCategoryLabel,
  getVehicleTypeLabel,
  getLeadSourceLabel,
  getSponsorshipTierLabel,
} from "@/lib/constants/vendor";
import type { Vendor, VendorLead, TransportBooking } from "@carelink/types";
import { BookingStatus, LeadStatus } from "@carelink/types";

// ============================================
// BADGE CONFIGURATION HELPERS
// ============================================

export function getBookingStatusBadgeConfig(
  status: BookingStatus
): { label: string; variant: BadgeProps["variant"] } {
  return getBookingStatusConfig(status);
}

export function getLeadStatusBadgeConfig(
  status: LeadStatus
): { label: string; variant: BadgeProps["variant"] } {
  return getLeadStatusConfig(status);
}

// ============================================
// DISPLAY NAME HELPERS
// ============================================

export function getVendorDisplayName(vendor: Vendor): string {
  return vendor.businessName || "Unnamed Vendor";
}

export function getLeadDisplayName(lead: VendorLead): string {
  return lead.name || lead.email || "Unknown Lead";
}

// ============================================
// FORMAT HELPERS
// ============================================

export function formatVendorCategory(category: string): string {
  return getVendorCategoryLabel(category as any);
}

export function formatVehicleType(vehicleType: string): string {
  return getVehicleTypeLabel(vehicleType);
}

export function formatLeadSource(source: string): string {
  return getLeadSourceLabel(source);
}

export function formatSponsorshipTier(tier: string): string {
  return getSponsorshipTierLabel(tier);
}

// ============================================
// STATUS HELPERS
// ============================================

export function isBookingPending(booking: TransportBooking): boolean {
  return booking.status === BookingStatus.PENDING;
}

export function isBookingActive(booking: TransportBooking): boolean {
  return [
    BookingStatus.CONFIRMED,
    BookingStatus.IN_TRANSIT,
  ].includes(booking.status);
}

export function isBookingCompleted(booking: TransportBooking): boolean {
  return booking.status === BookingStatus.COMPLETED;
}

export function isLeadNew(lead: VendorLead): boolean {
  return lead.status === LeadStatus.NEW;
}

export function isLeadConverted(lead: VendorLead): boolean {
  return lead.status === LeadStatus.CONVERTED;
}


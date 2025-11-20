/**
 * Vendor Constants for Marketplace Vendors Dashboard
 *
 * This file contains all vendor-specific constants including:
 * - Vendor category labels and configurations
 * - Booking status badge configurations
 * - Lead status badge configurations
 * - Vehicle types
 * - Lead sources
 */

import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Package,
  Truck,
  Home,
  Scale,
  Users,
  MapPin,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BadgeProps } from "@/components/ui/badge";
import { VendorCategory, BookingStatus, LeadStatus } from "@carelink/types";

// ============================================
// VENDOR CATEGORY CONFIGURATION
// ============================================

export interface VendorCategoryOption {
  value: VendorCategory;
  label: string;
  description: string;
  icon?: LucideIcon;
}

export const VENDOR_CATEGORIES: VendorCategoryOption[] = [
  {
    value: VendorCategory.TRAINING,
    label: "Training",
    description: "Professional training services",
    icon: Users,
  },
  {
    value: VendorCategory.DME,
    label: "DME",
    description: "Durable Medical Equipment",
    icon: Package,
  },
  {
    value: VendorCategory.HOME_MODS,
    label: "Home Modifications",
    description: "Home accessibility modifications",
    icon: Home,
  },
  {
    value: VendorCategory.LEGAL,
    label: "Legal Services",
    description: "Legal and advocacy services",
    icon: Scale,
  },
  {
    value: VendorCategory.STAFFING,
    label: "Staffing",
    description: "Healthcare staffing services",
    icon: Users,
  },
  {
    value: VendorCategory.TRANSPORT,
    label: "Transportation",
    description: "Non-Emergency Medical Transportation (NEMT)",
    icon: Truck,
  },
];

export const VENDOR_CATEGORIES_MAP: Record<VendorCategory, string> =
  VENDOR_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.value] = category.label;
      return acc;
    },
    {} as Record<VendorCategory, string>
  );

export function getVendorCategoryLabel(category: VendorCategory): string {
  return VENDOR_CATEGORIES_MAP[category] || category;
}

// ============================================
// BOOKING STATUS CONFIGURATION
// ============================================

export interface StatusConfig {
  label: string;
  variant: BadgeProps["variant"];
  icon?: LucideIcon;
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  [BookingStatus.PENDING]: {
    label: "Pending",
    variant: "outline",
    icon: Clock,
  },
  [BookingStatus.CONFIRMED]: {
    label: "Confirmed",
    variant: "healthcarePrimary",
    icon: CheckCircle,
  },
  [BookingStatus.IN_TRANSIT]: {
    label: "In Transit",
    variant: "healthcareSecondary",
    icon: Truck,
  },
  [BookingStatus.COMPLETED]: {
    label: "Completed",
    variant: "healthcareSuccess",
    icon: CheckCircle,
  },
  [BookingStatus.CANCELLED]: {
    label: "Cancelled",
    variant: "destructive",
    icon: XCircle,
  },
};

export function getBookingStatusBadgeConfig(
  status: BookingStatus
): StatusConfig {
  return BOOKING_STATUS_CONFIG[status];
}

// ============================================
// LEAD STATUS CONFIGURATION
// ============================================

export const LEAD_STATUS_CONFIG: Record<LeadStatus, StatusConfig> = {
  [LeadStatus.NEW]: {
    label: "New",
    variant: "healthcarePrimary",
    icon: AlertCircle,
  },
  [LeadStatus.CONTACTED]: {
    label: "Contacted",
    variant: "healthcareSecondary",
    icon: Clock,
  },
  [LeadStatus.QUALIFIED]: {
    label: "Qualified",
    variant: "outline",
    icon: CheckCircle,
  },
  [LeadStatus.CONVERTED]: {
    label: "Converted",
    variant: "healthcareSuccess",
    icon: CheckCircle,
  },
  [LeadStatus.LOST]: {
    label: "Lost",
    variant: "destructive",
    icon: XCircle,
  },
};

export function getLeadStatusBadgeConfig(status: LeadStatus): StatusConfig {
  return LEAD_STATUS_CONFIG[status];
}

// ============================================
// VEHICLE TYPES
// ============================================

export interface VehicleTypeOption {
  value: string;
  label: string;
  description: string;
}

export const VEHICLE_TYPES: VehicleTypeOption[] = [
  {
    value: "AMBULANCE",
    label: "Ambulance",
    description: "Full medical transport ambulance",
  },
  {
    value: "WHEELCHAIR_VAN",
    label: "Wheelchair Van",
    description: "Wheelchair accessible van",
  },
  {
    value: "SEDAN",
    label: "Sedan",
    description: "Standard passenger vehicle",
  },
];

export const VEHICLE_TYPES_MAP: Record<string, string> = VEHICLE_TYPES.reduce(
  (acc, type) => {
    acc[type.value] = type.label;
    return acc;
  },
  {} as Record<string, string>
);

export function getVehicleTypeLabel(vehicleType: string): string {
  return VEHICLE_TYPES_MAP[vehicleType] || vehicleType;
}

// ============================================
// LEAD SOURCES
// ============================================

export interface LeadSourceOption {
  value: string;
  label: string;
}

export const LEAD_SOURCES: LeadSourceOption[] = [
  { value: "MARKETPLACE", label: "Marketplace" },
  { value: "REFERRAL", label: "Referral" },
  { value: "AD", label: "Advertisement" },
];

export const LEAD_SOURCES_MAP: Record<string, string> = LEAD_SOURCES.reduce(
  (acc, source) => {
    acc[source.value] = source.label;
    return acc;
  },
  {} as Record<string, string>
);

export function getLeadSourceLabel(source: string): string {
  return LEAD_SOURCES_MAP[source] || source;
}

// ============================================
// SPONSORSHIP TIERS
// ============================================

export interface SponsorshipTierOption {
  value: string;
  label: string;
  description: string;
}

export const SPONSORSHIP_TIERS: SponsorshipTierOption[] = [
  {
    value: "BASIC",
    label: "Basic",
    description: "Basic sponsorship tier",
  },
  {
    value: "PREMIUM",
    label: "Premium",
    description: "Premium sponsorship tier",
  },
];

export const SPONSORSHIP_TIERS_MAP: Record<string, string> =
  SPONSORSHIP_TIERS.reduce(
    (acc, tier) => {
      acc[tier.value] = tier.label;
      return acc;
    },
    {} as Record<string, string>
  );

export function getSponsorshipTierLabel(tier: string): string {
  return SPONSORSHIP_TIERS_MAP[tier] || tier;
}


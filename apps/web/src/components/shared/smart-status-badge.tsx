"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ReferralStatus,
  Urgency,
  PlacementStatus,
  OpeningStatus,
  UserStatus,
  OrganizationStatus,
  LicenseStatus,
  VRSClientStatus,
  JobStatus,
  ReferralStatus as ReferralStatusEnum,
} from "@carelink/types";
import {
  URGENCY_CONFIG,
  REFERRAL_STATUS_CONFIG,
  PLACEMENT_STATUS_CONFIG,
  OPENING_STATUS_CONFIG,
} from "@/lib/constants";
import type { BadgeProps } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

type StatusType =
  | "referral"
  | "urgency"
  | "placement"
  | "opening"
  | "user"
  | "organization"
  | "license"
  | "vrsClient"
  | "job";

type StatusValue =
  | ReferralStatus
  | Urgency
  | PlacementStatus
  | OpeningStatus
  | UserStatus
  | OrganizationStatus
  | LicenseStatus
  | VRSClientStatus
  | JobStatus;

interface StatusBadgeConfig {
  label: string;
  variant: BadgeProps["variant"];
  icon?: LucideIcon;
}

interface SmartStatusBadgeProps {
  type: StatusType;
  status: StatusValue;
  config?: StatusBadgeConfig;
  className?: string;
  showIcon?: boolean;
}

/**
 * Smart status badge component that automatically applies the correct
 * styling based on status type and value using centralized configurations
 */
export function SmartStatusBadge({
  type,
  status,
  config,
  className,
  showIcon = false,
}: SmartStatusBadgeProps) {
  // Use custom config if provided, otherwise look up from centralized configs
  let badgeConfig: StatusBadgeConfig;

  if (config) {
    badgeConfig = config;
  } else {
    // Look up from centralized configs based on type
    switch (type) {
      case "referral": {
        const config = REFERRAL_STATUS_CONFIG[status as ReferralStatusEnum];
        badgeConfig = config
          ? {
              label: config.label,
              variant: config.color, // REFERRAL_STATUS_CONFIG uses 'color'
            }
          : {
              label: String(status),
              variant: "outline",
            };
        break;
      }
      case "urgency": {
        const config = URGENCY_CONFIG[status as Urgency];
        badgeConfig = config
          ? {
              label: config.label,
              variant: config.color, // URGENCY_CONFIG uses 'color'
              icon: config.icon,
            }
          : {
              label: String(status),
              variant: "outline",
            };
        break;
      }
      case "placement": {
        const config = PLACEMENT_STATUS_CONFIG[status as PlacementStatus];
        badgeConfig = config
          ? {
              label: config.label,
              variant: config.variant,
            }
          : {
              label: String(status),
              variant: "outline",
            };
        break;
      }
      case "opening": {
        const config = OPENING_STATUS_CONFIG[status as OpeningStatus];
        badgeConfig = config
          ? {
              label: config.label,
              variant: config.color, // OPENING_STATUS_CONFIG uses 'color'
              icon: config.icon,
            }
          : {
              label: String(status),
              variant: "outline",
            };
        break;
      }
      default:
        badgeConfig = {
          label: String(status),
          variant: "outline",
        };
    }
  }

  const Icon = badgeConfig.icon;

  return (
    <Badge variant={badgeConfig.variant} className={cn("gap-1.5", className)}>
      {showIcon && Icon && (
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      {badgeConfig.label}
    </Badge>
  );
}

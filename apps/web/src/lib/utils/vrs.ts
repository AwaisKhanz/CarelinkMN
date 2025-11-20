import type { BadgeProps } from "@/components/ui/badge";
import {
  VRSClientStatus,
  JobStatus,
  RetentionStatus,
} from "@carelink/types";
import {
  VRS_CLIENT_STATUS_CONFIG,
  VRS_JOB_STATUS_CONFIG,
  RETENTION_STATUS_CONFIG,
} from "@/lib/constants/vrs";

export function getVRSClientStatusBadgeConfig(status: VRSClientStatus): {
  label: string;
  variant: BadgeProps["variant"];
} {
  const config = VRS_CLIENT_STATUS_CONFIG[status];
  return {
    label: config.label,
    variant: config.variant || "outline",
  };
}

export function getVRSJobStatusBadgeConfig(status: JobStatus): {
  label: string;
  variant: BadgeProps["variant"];
} {
  const config = VRS_JOB_STATUS_CONFIG[status];
  return {
    label: config.label,
    variant: config.variant || "outline",
  };
}

export function getVRSRetentionStatusBadgeConfig(
  status: RetentionStatus
): {
  label: string;
  variant: BadgeProps["variant"];
} {
  const config = RETENTION_STATUS_CONFIG[status];
  return {
    label: config.label,
    variant: config.variant || "outline",
  };
}

export function getClientDisplayName(
  firstName: string,
  lastName: string
): string {
  return `${firstName} ${lastName}`;
}


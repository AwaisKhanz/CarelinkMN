import {
  JobStatus,
  VRSClientStatus,
  RetentionStatus,
} from "@carelink/types";
import type { BadgeProps } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  Briefcase,
  Target,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

export interface StatusConfig {
  label: string;
  description?: string;
  variant?: BadgeProps["variant"];
  icon?: LucideIcon;
}

export const VRS_CLIENT_STATUS_CONFIG: Record<VRSClientStatus, StatusConfig> = {
  INTAKE: {
    label: "Intake",
    description: "Initial interview in progress",
    variant: "healthcareInfo",
    icon: Users,
  },
  ASSESSMENT: {
    label: "Assessment",
    description: "Evaluating skills and interests",
    variant: "healthcareWarning",
    icon: Target,
  },
  JOB_READY: {
    label: "Job Ready",
    description: "Cleared for job placement",
    variant: "healthcareSuccess",
    icon: CheckCircle,
  },
  JOB_SEARCHING: {
    label: "Job Searching",
    description: "Actively applying for roles",
    variant: "outline",
    icon: Briefcase,
  },
  PLACED: {
    label: "Placed",
    description: "Placement secured",
    variant: "healthcarePrimary",
    icon: CheckCircle,
  },
  FOLLOW_UP: {
    label: "Follow Up",
    description: "Post-placement follow up",
    variant: "healthcareSecondary",
    icon: TrendingUp,
  },
  CLOSED: {
    label: "Closed",
    description: "Case closed",
    variant: "outline",
  },
};

export const VRS_JOB_STATUS_CONFIG: Record<JobStatus, StatusConfig> = {
  DRAFT: {
    label: "Draft",
    variant: "outline",
  },
  OPEN: {
    label: "Open",
    variant: "healthcareSuccess",
    icon: Briefcase,
  },
  FILLED: {
    label: "Filled",
    variant: "healthcarePrimary",
    icon: CheckCircle,
  },
  CLOSED: {
    label: "Closed",
    variant: "outline",
  },
};

export const RETENTION_STATUS_CONFIG: Record<RetentionStatus, StatusConfig> = {
  RETAINED: {
    label: "Retained",
    variant: "healthcareSuccess",
  },
  NOT_RETAINED: {
    label: "Not Retained",
    variant: "destructive",
  },
  PENDING: {
    label: "Pending",
    variant: "outline",
  },
};

export const VRS_QUICK_ACTIONS = [
  {
    label: "Add New Client",
    description: "Create a new VRS client record",
    href: "/vrs/clients/create",
  },
  {
    label: "Match Client to Job",
    description: "Use job matching assistant",
    href: "/vrs/matching",
  },
  {
    label: "Log Employer Outreach",
    description: "Track employer engagement",
    href: "/vrs/employers",
  },
  {
    label: "Update Retention Status",
    description: "Record 30/60/90 day outcomes",
    href: "/vrs/placements",
  },
];


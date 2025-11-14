"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { LicenseStatus } from "@carelink/types";

interface LicenseStatusBadgeProps {
  status: LicenseStatus;
  className?: string;
}

export function LicenseStatusBadge({ status, className }: LicenseStatusBadgeProps) {
  switch (status) {
    case LicenseStatus.ACTIVE:
      return (
        <Badge variant="healthcareSuccess" className={className}>
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case LicenseStatus.PENDING:
      return (
        <Badge variant="healthcareWarning" className={className}>
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case LicenseStatus.EXPIRED:
      return (
        <Badge variant="healthcareError" className={className}>
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    case LicenseStatus.SUSPENDED:
      return (
        <Badge variant="healthcareError" className={className}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          Suspended
        </Badge>
      );
    case LicenseStatus.REVOKED:
      return (
        <Badge variant="healthcareError" className={className}>
          <XCircle className="h-3 w-3 mr-1" />
          Revoked
        </Badge>
      );
    default:
      return null;
  }
}


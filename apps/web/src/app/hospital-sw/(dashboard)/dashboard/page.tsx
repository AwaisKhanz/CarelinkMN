"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, Plus, ArrowRight } from "lucide-react";
import { HospitalSWGuard } from "@/components/auth/route-guard";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { usePageMetadata } from "../use-page-metadata";
import { DischargeStatus } from "@carelink/types";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import {
  HospitalSWLoadingState,
  HospitalSWStatsGrid,
} from "@/components/hospital-sw";
import { useDischargeCases } from "@/hooks/use-hospital-sw-data";
import {
  isDischargeCaseActive,
  isDischargeUrgent,
} from "@/lib/utils/hospital-sw";

function HospitalSWDashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { hasCapability } = useRolePermissions();
  const canCreateDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_CREATE
  );
  const canViewDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_VIEW
  );

  // Use shared hook for fetching discharge cases
  const { cases, isLoading } = useDischargeCases(
    canViewDischarges
      ? {
          page: 1,
          limit: 1000, // Get all for stats
        }
      : undefined
  );

  useEffect(() => {
    setTitle("Hospital Social Work Dashboard");
    setDescription(`Welcome back, ${user?.firstName} ${user?.lastName}`);
  }, [setTitle, setDescription, user]);

  // Calculate stats using shared utilities
  const stats = useMemo(() => {
    if (!cases.length) {
      return {
        activeCases: 0,
        pendingPlacements: 0,
        completedThisMonth: 0,
        urgentCases: 0,
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      activeCases: cases.filter((c) => isDischargeCaseActive(c.status)).length,
      pendingPlacements: cases.filter(
        (c) =>
          c.status === DischargeStatus.RESPONSES_PENDING ||
          c.status === DischargeStatus.INVITES_SENT
      ).length,
      completedThisMonth: cases.filter((c) => {
        if (
          c.status !== DischargeStatus.COMPLETED &&
          c.status !== DischargeStatus.DISCHARGED
        ) {
          return false;
        }
        const completedDate = c.actualDischargeDate || c.placedAt;
        if (!completedDate) return false;
        const date =
          typeof completedDate === "string"
            ? new Date(completedDate)
            : completedDate;
        return date >= startOfMonth;
      }).length,
      urgentCases: cases.filter((c) => {
        const targetDate =
          typeof c.targetDischargeDate === "string"
            ? c.targetDischargeDate
            : c.targetDischargeDate.toISOString();
        return isDischargeUrgent(targetDate) && isDischargeCaseActive(c.status);
      }).length,
    };
  }, [cases]);

  // Prepare stats for stats grid component
  const statsData = useMemo(
    () => [
      {
        label: "Active Discharges",
        value: stats.activeCases,
        icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        description: "Currently in progress",
      },
      {
        label: "Pending Placements",
        value: stats.pendingPlacements,
        icon: <Clock className="h-4 w-4 text-muted-foreground" />,
        description: "Awaiting provider responses",
      },
      {
        label: "Urgent Cases",
        value: stats.urgentCases,
        icon: <Clock className="h-4 w-4 text-muted-foreground" />,
        description: "Discharging within 3 days",
      },
      {
        label: "This Month",
        value: stats.completedThisMonth,
        icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
        description: "Successful discharges",
      },
    ],
    [stats]
  );

  if (isLoading) {
    return <HospitalSWLoadingState message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <HospitalSWStatsGrid stats={statsData} columns={4} />

      {/* Quick Actions */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common social work tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canCreateDischarges && (
            <Button
              variant="healthcare"
              className="w-full justify-start"
              onClick={() => router.push("/hospital-sw/discharges/create")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Discharge Case
            </Button>
          )}
          {canViewDischarges && (
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/hospital-sw/discharges")}
            >
              <FileText className="mr-2 h-4 w-4" />
              View All Discharge Cases
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          )}
          {canViewDischarges && (
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() =>
                router.push("/hospital-sw/discharges?status=RESPONSES_PENDING")
              }
            >
              <Clock className="mr-2 h-4 w-4" />
              Review Pending Discharges
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function HospitalSWDashboard() {
  return (
    <HospitalSWGuard>
      <RequirePermission
        permission={HOSPITAL_SW_CAPABILITIES.DASHBOARD_VIEW}
        title="Access Restricted"
        description="You don't have permission to view the hospital social worker dashboard."
      >
        <HospitalSWDashboardContent />
      </RequirePermission>
    </HospitalSWGuard>
  );
}

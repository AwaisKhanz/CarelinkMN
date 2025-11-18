"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { HospitalSWGuard } from "@/components/auth/route-guard";
import { HospitalSWOnboardingGuard } from "@/components/auth/role-onboarding-guard";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { usePageMetadata } from "../(dashboard)/use-page-metadata";
import { dischargeCaseService } from "@/lib/api";
import { DischargeStatus } from "@carelink/types";
import { useRolePermissions } from "@/hooks/use-role-permissions";

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

  const [stats, setStats] = useState({
    activeCases: 0,
    pendingPlacements: 0,
    completedThisMonth: 0,
    urgentCases: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTitle("Hospital Social Work Dashboard");
    setDescription(`Welcome back, ${user?.firstName} ${user?.lastName}`);
  }, [setTitle, setDescription, user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await dischargeCaseService.getDischargeCases({
          page: 1,
          limit: 1000, // Get all for stats
        });

        if (response.success && response.data) {
          const cases = response.data.cases || [];
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          setStats({
            activeCases: cases.filter(
              (c) =>
                c.status !== DischargeStatus.COMPLETED &&
                c.status !== DischargeStatus.CANCELLED
            ).length,
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
                  ? new Date(c.targetDischargeDate)
                  : c.targetDischargeDate;
              const daysUntil = Math.ceil(
                (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                daysUntil <= 3 &&
                c.status !== DischargeStatus.COMPLETED &&
                c.status !== DischargeStatus.DISCHARGED
              );
            }).length,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (canViewDischarges) {
      fetchStats();
    }
  }, [canViewDischarges]);

  return (
    <div>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Discharges
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.activeCases}</div>
                <p className="text-xs text-muted-foreground">
                  Currently in progress
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Placements
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.pendingPlacements}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting provider responses
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Cases</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.urgentCases}</div>
                <p className="text-xs text-muted-foreground">
                  Discharging within 3 days
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.completedThisMonth}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successful discharges
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
      <HospitalSWOnboardingGuard>
        <RequirePermission
          permission={HOSPITAL_SW_CAPABILITIES.DASHBOARD_VIEW}
          title="Access Restricted"
          description="You don't have permission to view the hospital social worker dashboard."
        >
          <HospitalSWDashboardContent />
        </RequirePermission>
      </HospitalSWOnboardingGuard>
    </HospitalSWGuard>
  );
}

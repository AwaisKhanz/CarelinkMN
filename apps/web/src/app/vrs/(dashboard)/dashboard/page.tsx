"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Users, FileText, Briefcase, CheckCircle } from "lucide-react";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { usePageMetadata } from "../use-page-metadata";
import { vrsService } from "@/lib/api";
import { toast } from "sonner";
import { VRSLoadingState, VRSErrorState } from "@/components/vrs";
import { JobStatus } from "@carelink/types";

export default function VRSDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeJobs: 0,
    totalPlacements: 0,
    placementsThisMonth: 0,
  });

  useEffect(() => {
    setTitle("VRS Specialist Dashboard");
    setDescription(
      `Welcome back, ${[user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(" ")}`
    );
  }, [setTitle, setDescription, user?.firstName, user?.lastName]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        clientsResponse,
        jobsResponse,
        placementsResponse,
        analyticsResponse,
      ] = await Promise.all([
        vrsService.getClients({ limit: 1 }),
        vrsService.getJobs({ limit: 1, status: JobStatus.OPEN }),
        vrsService.getPlacements({ limit: 1 }),
        vrsService.getAnalytics(),
      ]);

      if (
        clientsResponse.success &&
        jobsResponse.success &&
        placementsResponse.success &&
        analyticsResponse.success
      ) {
        setStats({
          totalClients: clientsResponse.data?.pagination.total || 0,
          activeJobs: jobsResponse.data?.pagination.total || 0,
          totalPlacements: placementsResponse.data?.pagination.total || 0,
          placementsThisMonth:
            analyticsResponse.data?.placementsThisQuarter || 0,
        });
      } else {
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return <VRSLoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <VRSErrorState
        message={error}
        action={{
          label: "Retry",
          onClick: fetchDashboardData,
        }}
      />
    );
  }

  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.DASHBOARD_VIEW}
      title="Access Restricted"
      description="You don't have permission to view the VRS dashboard."
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card variant="healthcare">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Clients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                All clients in system
              </p>
            </CardContent>
          </Card>
          <Card variant="healthcare">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">Currently open</p>
            </CardContent>
          </Card>
          <Card variant="healthcare">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Placements
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlacements}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card variant="healthcare">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                This Quarter
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.placementsThisMonth}
              </div>
              <p className="text-xs text-muted-foreground">
                Placements this quarter
              </p>
            </CardContent>
          </Card>
        </div>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common VRS specialist tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="healthcare"
              className="w-full justify-start"
              onClick={() => router.push("/vrs/clients")}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Clients
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/vrs/jobs")}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Manage Jobs & Placements
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/vrs/employers")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Manage Employers
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/vrs/analytics")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}

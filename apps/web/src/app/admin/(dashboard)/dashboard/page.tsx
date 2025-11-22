"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
import {
  Users,
  Building2,
  FileText,
  Settings,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { usePageMetadata } from "../use-page-metadata";
import { StatsGrid, LoadingState, ErrorState } from "@/components/shared";
import { adminService, onboardingService } from "@/lib/api";
import { toast } from "sonner";
import { LicenseStatus, OrganizationStatus } from "@carelink/types";

function AdminDashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalOrganizations: 0,
    pendingVerifications: 0,
    activeLicenses: 0,
    pendingLicenseVerifications: 0,
    pendingProviderApprovals: 0,
    complianceIssues: 0,
  });

  useEffect(() => {
    setTitle("Admin Dashboard");
    setDescription(`Welcome back, ${user?.firstName} ${user?.lastName}`);
  }, [setTitle, setDescription, user]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [
        usersResponse,
        organizationsResponse,
        licensesResponse,
        pendingReviewsResponse,
        complianceResponse,
      ] = await Promise.all([
        adminService.getUsers({ page: 1, limit: 1 }),
        adminService.getOrganizations({ page: 1, limit: 1 }),
        adminService.getLicenses({
          page: 1,
          limit: 1,
          status: LicenseStatus.ACTIVE,
        }),
        onboardingService.getPendingReviews().catch(() => []),
        adminService
          .getComplianceIssues({ page: 1, limit: 1, status: "open" })
          .catch(() => ({
            success: false,
            data: { issues: [], pagination: { total: 0 } },
          })),
      ]);

      // Extract totals from pagination
      const totalUsers =
        usersResponse.success && usersResponse.data?.pagination
          ? usersResponse.data.pagination.total
          : 0;

      const totalOrganizations =
        organizationsResponse.success && organizationsResponse.data?.pagination
          ? organizationsResponse.data.pagination.total
          : 0;

      const activeLicenses =
        licensesResponse.success && licensesResponse.data?.pagination
          ? licensesResponse.data.pagination.total
          : 0;

      // Count pending license verifications
      const pendingLicenseVerifications =
        licensesResponse.success &&
        licensesResponse.data?.licenses &&
        Array.isArray(licensesResponse.data.licenses)
          ? licensesResponse.data.licenses.filter(
              (l) => l.status === LicenseStatus.PENDING
            ).length
          : 0;

      // Count pending provider approvals (from onboarding reviews)
      const pendingProviderApprovals = Array.isArray(pendingReviewsResponse)
        ? pendingReviewsResponse.filter(
            (review) => review.adminReviewStatus === "PENDING"
          ).length
        : 0;

      // Count compliance issues
      const complianceIssues =
        complianceResponse.success && complianceResponse.data?.pagination
          ? complianceResponse.data.pagination.total
          : 0;

      // Count pending verifications (organizations with PENDING status)
      const pendingVerifications =
        organizationsResponse.success &&
        organizationsResponse.data?.organizations &&
        Array.isArray(organizationsResponse.data.organizations)
          ? organizationsResponse.data.organizations.filter(
              (org) => org.status === OrganizationStatus.PENDING
            ).length
          : 0;

      setDashboardData({
        totalUsers,
        totalOrganizations,
        pendingVerifications,
        activeLicenses,
        pendingLicenseVerifications,
        pendingProviderApprovals,
        complianceIssues,
      });
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
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

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: dashboardData.totalUsers.toLocaleString(),
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        description: "All registered users",
      },
      {
        label: "Organizations",
        value: dashboardData.totalOrganizations.toLocaleString(),
        icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        description: "Active organizations",
      },
      {
        label: "Pending Verifications",
        value: dashboardData.pendingVerifications.toLocaleString(),
        icon: <Clock className="h-4 w-4 text-muted-foreground" />,
        description: "Requires attention",
      },
      {
        label: "Active Licenses",
        value: dashboardData.activeLicenses.toLocaleString(),
        icon: <ShieldCheck className="h-4 w-4 text-muted-foreground" />,
        description: "Currently active",
      },
    ],
    [dashboardData]
  );

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." fullHeight />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Dashboard"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchDashboardData,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <StatsGrid stats={stats} columns={4} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="healthcare"
              className="w-full justify-start"
              onClick={() => router.push("/admin/users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/admin/organizations")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Manage Organizations
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/admin/licenses")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify Licenses
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/admin/compliance")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Compliance Monitoring
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/admin/audit-logs")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Audit Logs
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/admin/analytics")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Platform Analytics
            </Button>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>
              Items requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.pendingLicenseVerifications > 0 && (
                <div className="flex items-center space-x-4 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {dashboardData.pendingLicenseVerifications} License
                      {dashboardData.pendingLicenseVerifications !== 1
                        ? "s"
                        : ""}{" "}
                      Verification
                      {dashboardData.pendingLicenseVerifications !== 1
                        ? "s"
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pending review
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push("/admin/licenses?status=PENDING")
                    }
                  >
                    Review
                  </Button>
                </div>
              )}
              {dashboardData.pendingProviderApprovals > 0 && (
                <div className="flex items-center space-x-4 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {dashboardData.pendingProviderApprovals} Provider
                      {dashboardData.pendingProviderApprovals !== 1
                        ? "s"
                        : ""}{" "}
                      Approval
                      {dashboardData.pendingProviderApprovals !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Awaiting verification
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin/onboarding-reviews")}
                  >
                    Review
                  </Button>
                </div>
              )}
              {dashboardData.complianceIssues > 0 && (
                <div className="flex items-center space-x-4 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {dashboardData.complianceIssues} Compliance Issue
                      {dashboardData.complianceIssues !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requires attention
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin/compliance")}
                  >
                    View
                  </Button>
                </div>
              )}
              {dashboardData.pendingLicenseVerifications === 0 &&
                dashboardData.pendingProviderApprovals === 0 &&
                dashboardData.complianceIssues === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending reviews</p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.SYSTEM_VIEW}
      title="Access Restricted"
      description="You don't have permission to view the admin dashboard."
    >
      <AdminDashboardContent />
    </RequirePermission>
  );
}

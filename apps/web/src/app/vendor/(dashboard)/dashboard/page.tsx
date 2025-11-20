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
import { Package, FileText, Users, Calendar } from "lucide-react";
import { RequirePermission } from "@/components/auth/require-permission";
import { VENDOR_CAPABILITIES } from "@/lib/permissions/capabilities";
import { usePageMetadata } from "../use-page-metadata";
import { vendorService } from "@/lib/api";
import { toast } from "sonner";
import {
  VendorLoadingState,
  VendorErrorState,
} from "@/components/vendor";
import { StatsCard } from "@/components/ui/stats-card";

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    setTitle("Vendor Dashboard");
    setDescription(
      `Welcome back, ${[user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(" ")}`
    );
  }, [setTitle, setDescription, user?.firstName, user?.lastName]);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      // Get vendor by user ID
      const vendorResponse = await vendorService.getVendorByUserId(user.id);
      if (!vendorResponse.success || !vendorResponse.data) {
        throw new Error("Vendor profile not found");
      }

      const vendor = vendorResponse.data;

      // Get analytics
      const analyticsResponse = await vendorService.getVendorAnalytics(vendor.id);
      if (analyticsResponse.success && analyticsResponse.data) {
        const analytics = analyticsResponse.data;
        setStats({
          totalLeads: analytics.totalLeads,
          newLeads: analytics.newLeads,
          totalBookings: analytics.totalBookings,
          pendingBookings: analytics.pendingBookings,
          completedBookings: analytics.completedBookings,
          conversionRate: analytics.conversionRate,
        });
      }
    } catch (err) {
      console.error("Error fetching vendor dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return <VendorLoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <VendorErrorState
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
      permission={VENDOR_CAPABILITIES.DASHBOARD_VIEW}
      title="Access Restricted"
      description="You don't have permission to view the vendor dashboard."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Leads"
            value={stats.totalLeads}
            description={`${stats.newLeads} new`}
          />
          <StatsCard
            title="Pending Bookings"
            value={stats.pendingBookings}
            description="Requires attention"
          />
          <StatsCard
            title="Completed Bookings"
            value={stats.completedBookings}
            description="This month"
          />
          <StatsCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            description="Lead to booking"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common vendor tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="healthcare"
                className="w-full justify-start"
                onClick={() => router.push("/vendor/profile")}
              >
                <Package className="mr-2 h-4 w-4" />
                Manage Profile
              </Button>
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/vendor/leads")}
              >
                <Users className="mr-2 h-4 w-4" />
                View Leads
              </Button>
              <Button
                variant="healthcareSecondary"
                className="w-full justify-start"
                onClick={() => router.push("/vendor/bookings")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Manage Bookings
              </Button>
            </CardContent>
          </Card>

          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activity feed coming soon
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </RequirePermission>
  );
}


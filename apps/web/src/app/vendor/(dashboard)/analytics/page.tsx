"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RequirePermission } from "@/components/auth/require-permission";
import { VENDOR_CAPABILITIES } from "@/lib/permissions/capabilities";
import { usePageMetadata } from "../use-page-metadata";
import { vendorService } from "@/lib/api";
import { toast } from "sonner";
import {
  VendorLoadingState,
  VendorErrorState,
} from "@/components/vendor";
import { VendorAnalytics } from "@carelink/types";
import { StatsCard } from "@/components/ui/stats-card";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLeadStatusBadgeConfig, getBookingStatusBadgeConfig } from "@/lib/utils/vendor";
import { formatLeadSource } from "@/lib/utils/vendor";

export default function VendorAnalyticsPage() {
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    setTitle("Analytics");
    setDescription("View your vendor performance metrics");
  }, [setTitle, setDescription]);

  const fetchVendor = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await vendorService.getVendorByUserId(user.id);
      if (response.success && response.data) {
        setVendorId(response.data.id);
      }
    } catch (err) {
      console.error("Error fetching vendor:", err);
    }
  }, [user?.id]);

  const fetchAnalytics = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await vendorService.getVendorAnalytics(vendorId);
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        setError("Failed to load analytics");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  useEffect(() => {
    if (vendorId) {
      fetchAnalytics();
    }
  }, [vendorId, fetchAnalytics]);

  if (isLoading) {
    return <VendorLoadingState message="Loading analytics..." />;
  }

  if (error || !analytics) {
    return (
      <VendorErrorState
        message={error || "Analytics not available"}
        action={{
          label: "Retry",
          onClick: fetchAnalytics,
        }}
      />
    );
  }

  return (
    <RequirePermission
      permission={VENDOR_CAPABILITIES.ANALYTICS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view analytics."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Leads"
            value={analytics.totalLeads}
            description={`${analytics.newLeads} new`}
          />
          <StatsCard
            title="Conversion Rate"
            value={`${analytics.conversionRate}%`}
            description={`${analytics.convertedLeads} converted`}
          />
          <StatsCard
            title="Total Bookings"
            value={analytics.totalBookings}
            description={`${analytics.completedBookings} completed`}
          />
          {analytics.totalRevenue !== undefined && (
            <StatsCard
              title="Total Revenue"
              value={`$${analytics.totalRevenue.toFixed(2)}`}
              description="From completed bookings"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Leads by Source</CardTitle>
              <CardDescription>Lead distribution by source</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.leadsBySource.length > 0 ? (
                <div className="space-y-3">
                  {analytics.leadsBySource.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatLeadSource(item.source)}
                        </span>
                      </div>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No leads data available</p>
              )}
            </CardContent>
          </Card>

          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Bookings by Status</CardTitle>
              <CardDescription>Booking distribution by status</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.bookingsByStatus.length > 0 ? (
                <div className="space-y-3">
                  {analytics.bookingsByStatus.map((item, index) => {
                    const statusConfig = getBookingStatusBadgeConfig(item.status);
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No bookings data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>This month's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Leads This Month</div>
                <div className="text-2xl font-bold mt-1">{analytics.leadsThisMonth}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bookings This Month</div>
                <div className="text-2xl font-bold mt-1">{analytics.bookingsThisMonth}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {analytics.averageRating !== undefined && (
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Ratings & Reviews</CardTitle>
              <CardDescription>Customer feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                  <span className="text-2xl font-bold">
                    {analytics.averageRating.toFixed(1)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Based on {analytics.reviewCount} review{analytics.reviewCount !== 1 ? "s" : ""}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RequirePermission>
  );
}


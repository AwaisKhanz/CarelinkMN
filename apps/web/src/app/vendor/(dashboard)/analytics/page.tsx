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
import {  ErrorState } from "@/components/shared";
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

  // Remove blocking loading state
  // if (isLoading) {
  //   return <LoadingState message="Loading analytics..." />;
  // }

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Error Loading Analytics"
        message={error || "Analytics not available"}
        action={{
          label: "Retry",
          onClick: fetchAnalytics,
          variant: "healthcare",
        }}
      />
    );
  }

  const safeAnalytics = analytics || {
    totalLeads: 0,
    newLeads: 0,
    conversionRate: 0,
    convertedLeads: 0,
    totalBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    leadsBySource: [],
    bookingsByStatus: [],
    leadsThisMonth: 0,
    bookingsThisMonth: 0,
    averageRating: 0,
    reviewCount: 0,
  };

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
            value={safeAnalytics.totalLeads}
            description={`${safeAnalytics.newLeads} new`}
            isLoading={isLoading}
          />
          <StatsCard
            title="Conversion Rate"
            value={`${safeAnalytics.conversionRate}%`}
            description={`${safeAnalytics.convertedLeads} converted`}
            isLoading={isLoading}
          />
          <StatsCard
            title="Total Bookings"
            value={safeAnalytics.totalBookings}
            description={`${safeAnalytics.completedBookings} completed`}
            isLoading={isLoading}
          />
          {(safeAnalytics.totalRevenue !== undefined || isLoading) && (
            <StatsCard
              title="Total Revenue"
              value={`$${(safeAnalytics.totalRevenue || 0).toFixed(2)}`}
              description="From completed bookings"
              isLoading={isLoading}
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
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-5 w-8 bg-muted animate-pulse rounded-full" />
                    </div>
                  ))}
                </div>
              ) : safeAnalytics.leadsBySource.length > 0 ? (
                <div className="space-y-3">
                  {safeAnalytics.leadsBySource.map((item, index) => (
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
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
                      <div className="h-4 w-8 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : safeAnalytics.bookingsByStatus.length > 0 ? (
                <div className="space-y-3">
                  {safeAnalytics.bookingsByStatus.map((item, index) => {
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
                {isLoading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <div className="text-2xl font-bold mt-1">{safeAnalytics.leadsThisMonth}</div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bookings This Month</div>
                {isLoading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <div className="text-2xl font-bold mt-1">{safeAnalytics.bookingsThisMonth}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {(safeAnalytics.averageRating !== undefined || isLoading) && (
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Ratings & Reviews</CardTitle>
              <CardDescription>Customer feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-4">
                  <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary fill-primary" />
                    <span className="text-2xl font-bold">
                      {(safeAnalytics.averageRating || 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Based on {safeAnalytics.reviewCount} review{safeAnalytics.reviewCount !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </RequirePermission>
  );
}


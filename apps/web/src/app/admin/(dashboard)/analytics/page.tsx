"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { adminService } from "@/lib/api";
import { toast } from "sonner";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import {
  AdminLoadingState,
  AdminErrorState,
  AdminStatsGrid,
} from "@/components/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Building2,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function AdminAnalyticsPageContent() {
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    setTitle("Platform Analytics");
    setDescription("View platform-wide analytics and metrics");
  }, [setTitle, setDescription]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getPlatformAnalytics({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        setError(response.message || "Failed to load analytics");
        toast.error(response.message || "Failed to load analytics");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Calculate stats from analytics data
  const stats = useMemo(() => {
    if (!analytics) {
      return [
        {
          label: "Total Users",
          value: "0",
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          description: "All registered users",
        },
        {
          label: "Organizations",
          value: "0",
          icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
          description: "Active organizations",
        },
        {
          label: "Active Referrals",
          value: "0",
          icon: <FileText className="h-4 w-4 text-muted-foreground" />,
          description: "Currently active",
        },
        {
          label: "Platform Activity",
          value: "0",
          icon: <Activity className="h-4 w-4 text-muted-foreground" />,
          description: "Actions this month",
        },
      ];
    }

    return [
      {
        label: "Total Users",
        value: (analytics.totalUsers || 0).toLocaleString(),
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        description: analytics.userGrowth
          ? `${analytics.userGrowth > 0 ? "+" : ""}${analytics.userGrowth}% from last month`
          : "All registered users",
        trend: analytics.userGrowth
          ? {
              value: `${Math.abs(analytics.userGrowth)}%`,
              isPositive: analytics.userGrowth > 0,
            }
          : undefined,
      },
      {
        label: "Organizations",
        value: (analytics.totalOrganizations || 0).toLocaleString(),
        icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        description: analytics.orgGrowth
          ? `${analytics.orgGrowth > 0 ? "+" : ""}${analytics.orgGrowth}% from last month`
          : "Active organizations",
        trend: analytics.orgGrowth
          ? {
              value: `${Math.abs(analytics.orgGrowth)}%`,
              isPositive: analytics.orgGrowth > 0,
            }
          : undefined,
      },
      {
        label: "Active Referrals",
        value: (analytics.activeReferrals || 0).toLocaleString(),
        icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        description: "Currently active",
      },
      {
        label: "Platform Activity",
        value: (analytics.platformActivity || 0).toLocaleString(),
        icon: <Activity className="h-4 w-4 text-muted-foreground" />,
        description: "Actions this month",
      },
    ];
  }, [analytics]);

  if (isLoading) {
    return <AdminLoadingState message="Loading analytics..." fullHeight />;
  }

  if (error) {
    return (
      <AdminErrorState
        title="Error Loading Analytics"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchAnalytics,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>Filter analytics by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="healthcare" onClick={fetchAnalytics}>
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <AdminStatsGrid stats={stats} columns={4} />

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Chart placeholder - Integration with charting library needed
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Platform Usage</CardTitle>
            <CardDescription>Key metrics and usage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Daily Active Users</span>
                <span className="font-medium">
                  {analytics?.dailyActiveUsers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Monthly Active Users</span>
                <span className="font-medium">
                  {analytics?.monthlyActiveUsers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Referrals</span>
                <span className="font-medium">
                  {analytics?.totalReferrals || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Placements</span>
                <span className="font-medium">
                  {analytics?.totalPlacements || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.ANALYTICS_SYSTEM}
      title="Access Restricted"
      description="You don't have permission to view platform analytics."
    >
      <AdminAnalyticsPageContent />
    </RequirePermission>
  );
}


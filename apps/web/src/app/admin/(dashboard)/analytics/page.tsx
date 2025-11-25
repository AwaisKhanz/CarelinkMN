"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { adminService } from "@/lib/api";
import { toast } from "sonner";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState, StatsGrid } from "@/components/shared";
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

  // Use real growth data from backend
  const userGrowthData = useMemo(() => {
    return analytics?.growthData || [];
  }, [analytics]);

  const activityData = useMemo(() => {
    return [
      { name: "Referrals", value: analytics?.totalReferrals || 0 },
      { name: "Placements", value: analytics?.totalPlacements || 0 },
      { name: "Active Users", value: analytics?.dailyActiveUsers || 0 },
      { name: "Searches", value: analytics?.totalSearches || 0 },
    ];
  }, [analytics]);

  if (isLoading) {
    return <LoadingState message="Loading analytics..." fullHeight />;
  }

  if (error) {
    return (
      <ErrorState
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
      <StatsGrid stats={stats} columns={4} variant="card" />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>User & Organization Growth</CardTitle>
            <CardDescription>New registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Users"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="organizations" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Organizations"
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Bar Chart */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>Key metrics comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Platform Usage Stats */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Platform Usage</CardTitle>
          <CardDescription>Detailed usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Daily Active Users</p>
              <p className="text-2xl font-bold">
                {(analytics?.dailyActiveUsers || 0).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Monthly Active Users</p>
              <p className="text-2xl font-bold">
                {(analytics?.monthlyActiveUsers || 0).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-2xl font-bold">
                {(analytics?.totalReferrals || 0).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Placements</p>
              <p className="text-2xl font-bold">
                {(analytics?.totalPlacements || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
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

